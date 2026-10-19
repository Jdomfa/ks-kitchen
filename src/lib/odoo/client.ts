const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

const LAGOS_UTC_OFFSET_HOURS = 1;

// ---------------------------------------------------------
// Generic Odoo JSON-RPC caller
// ---------------------------------------------------------

async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          ODOO_DB,
          await getUid(),
          ODOO_API_KEY,
          model,
          method,
          args,
          kwargs,
        ],
      },
    }),
  });

  const data = await res.json();

  if (data.error) {
    const detail =
      data.error.data?.message ||
      data.error.data?.debug ||
      data.error.message;

    throw new Error(`Odoo error: ${detail}`);
  }

  return data.result as T;
}

// ---------------------------------------------------------
// Authentication
// ---------------------------------------------------------

let uidPromise: Promise<number> | null = null;

function getUid(): Promise<number> {
  if (!uidPromise) {
    uidPromise = authenticate().catch((err) => {
      uidPromise = null;
      throw err;
    });
  }

  return uidPromise;
}

async function authenticate(): Promise<number> {
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [
          ODOO_DB,
          ODOO_USERNAME,
          ODOO_API_KEY,
          {},
        ],
      },
    }),
  });

  const data = await res.json();

  if (!data.result) {
    throw new Error(
      "Odoo authentication failed — check ODOO_DB, ODOO_USERNAME, ODOO_API_KEY.",
    );
  }

  return data.result as number;
}

// ---------------------------------------------------------
// Helpdesk (customer handoff tickets)
// ---------------------------------------------------------

export async function createHelpdeskTicket(args: {
  customerName: string;
  whatsappNumber: string;
  message: string;
}): Promise<number> {
  const teamName =
    process.env.ODOO_HELPDESK_TEAM_NAME || "WhatsApp Support";

  const teamIds = await odooCall<number[]>(
    "helpdesk.team",
    "search",
    [
      [
        ["name", "=", teamName],
      ],
    ],
  );

  if (!teamIds || teamIds.length === 0) {
    throw new Error(
      `Odoo helpdesk team "${teamName}" not found.`,
    );
  }

  const ticketId = await odooCall<number>(
    "helpdesk.ticket",
    "create",
    [
      {
        name: `WhatsApp: ${args.customerName}`,
        description: args.message,
        team_id: teamIds[0],
        x_studio_whatsapp_number:
          args.whatsappNumber,
      },
    ],
  );

  return ticketId;
}

export async function logCustomerMessageOnTicket(
  ticketId: number,
  message: string,
): Promise<void> {
  await odooCall(
    "helpdesk.ticket",
    "message_post",
    [ticketId],
    {
      body: `<b>Customer:</b> ${message}`,
      message_type: "comment",
    },
  );
}

export async function clearSendReplyFlag(
  ticketId: number,
): Promise<void> {
  await odooCall(
    "helpdesk.ticket",
    "write",
    [
      [ticketId],
      {
        x_studio_send_reply_to_customer:
          false,
      },
    ],
  );
}

export async function logSentReplyOnTicket(
  ticketId: number,
  message: string,
): Promise<void> {
  await odooCall(
    "helpdesk.ticket",
    "message_post",
    [ticketId],
    {
      body: `<b>Sent to customer via WhatsApp:</b> ${message}`,
      message_type: "comment",
    },
  );
}

// ---------------------------------------------------------
// Reservation WhatsApp confirmation
// ---------------------------------------------------------

type ReservationConfirmationWhatsAppArgs = {
  name: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  reservationCode: string;
};

type OdooWhatsAppTemplate = {
  id: number;
  name: string;
  template_name: string;
  status: string;
  model: string | false;
};

type OdooPartner = {
  id: number;
  name: string;
  phone: string | false;
};

/**
 * Formats:
 *
 * 2026-10-16
 *
 * to:
 *
 * 16 October 2026
 */
function formatReservationWhatsAppDate(
  dateISO: string,
): string {
  const [year, month, day] = dateISO
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return dateISO;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    ),
  );
}

/**
 * Formats:
 *
 * 18:00
 *
 * to:
 *
 * 6:00 PM
 */
function formatReservationWhatsAppTime(
  time: string,
): string {
  const [hourString, minuteString = "00"] =
    time.split(":");

  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return time;
  }

  const suffix =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${String(
    minute,
  ).padStart(2, "0")} ${suffix}`;
}

/**
 * The reservation confirmation template is configured against
 * res.partner, so we need the actual customer contact.
 *
 * This Odoo database uses `phone` on res.partner.
 * It does NOT expose `mobile`, so we deliberately search only
 * against the phone field.
 */
async function getOrCreateReservationPartner(
  name: string,
  phone: string,
): Promise<number> {
  const partners =
    await odooCall<OdooPartner[]>(
      "res.partner",
      "search_read",
      [
        [
          ["phone", "=", phone],
        ],
      ],
      {
        fields: [
          "id",
          "name",
          "phone",
        ],
        limit: 1,
      },
    );

  if (partners.length > 0) {
    return partners[0].id;
  }

  console.warn(
    `No existing Odoo partner found for ${phone}; creating one before sending reservation confirmation.`,
  );

  return odooCall<number>(
    "res.partner",
    "create",
    [
      {
        name,
        phone,
      },
    ],
  );
}

/**
 * Sends the approved Odoo WhatsApp template:
 *
 * reservation_confirmation_v2
 *
 * Variables:
 *
 * {{1}} = Customer name
 * {{2}} = Guests
 * {{3}} = Date
 * {{4}} = Time
 * {{5}} = Reservation code
 * {{6}} = Phone number
 */
export async function sendReservationConfirmationWhatsApp(
  args: ReservationConfirmationWhatsAppArgs,
): Promise<unknown> {
  const name = args.name.trim();
  const phone = args.phone.trim();
  const reservationCode =
    args.reservationCode.trim();

  console.log("========================================");
  console.log("WHATSAPP CONFIRMATION DEBUG");
  console.log("========================================");
  console.log("INPUT", {
    name,
    phone,
    partySize: args.partySize,
    date: args.date,
    time: args.time,
    reservationCode,
  });

  try {
    const formattedPhone = phone;
    console.log("PHONE", {
      original: args.phone,
      formatted: formattedPhone,
    });

    if (!name) {
      throw new Error(
        "Cannot send reservation confirmation without a customer name.",
      );
    }

    if (!phone) {
      throw new Error(
        "Cannot send reservation confirmation without a phone number.",
      );
    }

    if (!reservationCode) {
      throw new Error(
        "Cannot send reservation confirmation without a reservation code.",
      );
    }

    // -------------------------------------------------------
    // Find approved Odoo WhatsApp template
    // -------------------------------------------------------

    const templates =
      await odooCall<
        OdooWhatsAppTemplate[]
      >(
        "whatsapp.template",
        "search_read",
        [
          [
            [
              "template_name",
              "=",
              "reservation_confirmation_v3",
            ],
            [
              "status",
              "=",
              "approved",
            ],
          ],
        ],
        {
          fields: [
            "id",
            "name",
            "template_name",
            "status",
            "model",
          ],
          limit: 1,
        },
      );

    console.log("TEMPLATE LOOKUP", templates);

    const template = templates[0];

    if (!template) {
      throw new Error(
        'Approved Odoo WhatsApp template "reservation_confirmation_v3" was not found.',
      );
    }

    console.log("TEMPLATE", {
      id: template.id,
      name: template.name,
      status: template.status,
    });

    if (
      template.model &&
      template.model !== "res.partner"
    ) {
      throw new Error(
        `WhatsApp template reservation_confirmation_v3 is configured for ${template.model}, expected res.partner.`,
      );
    }

    // -------------------------------------------------------
    // Find or create customer partner
    // -------------------------------------------------------

    const partnerId =
      await getOrCreateReservationPartner(
        name,
        formattedPhone,
      );

    console.log("PARTNER", {
      partnerId,
      phone: formattedPhone,
    });

    // -------------------------------------------------------
    // Create native Odoo WhatsApp composer
    // -------------------------------------------------------

    const composerId =
      await odooCall<number>(
        "whatsapp.composer",
        "create",
        [
          {
            res_model: "res.partner",

            /**
             * Odoo 19 stores res_ids as a Char field containing
             * a serialized list of record IDs.
             */
            res_ids: JSON.stringify([
              partnerId,
            ]),

            batch_mode: false,

            phone: formattedPhone,

            wa_template_id:
              template.id,

            // {{1}} Customer name
            free_text_1: name,

            // {{2}} Guests
            free_text_2:
              String(args.partySize),

            // {{3}} Date
            free_text_3:
              formatReservationWhatsAppDate(
                args.date,
              ),

            // {{4}} Time
            free_text_4:
              formatReservationWhatsAppTime(
                args.time,
              ),

            // {{5}} Reservation code
            free_text_5:
              reservationCode,

            // {{6}} Phone number
            free_text_6:
              formattedPhone,
          },
        ],
      );

    if (!composerId) {
      throw new Error(
        "Odoo did not create the WhatsApp composer.",
      );
    }

    console.log("ODOO COMPOSER CREATED", {
      composerId,
      partnerId,
      templateId: template.id,
    });

    // -------------------------------------------------------
    // Send template through native Odoo WhatsApp module
    // -------------------------------------------------------

    console.log("ABOUT TO SEND", {
      partnerId,
      templateId: template.id,
      composerId,
      phone: formattedPhone,
    });

    const sendResult =
      await odooCall<unknown>(
        "whatsapp.composer",
        "action_send_whatsapp_template",
        [
          [composerId],
        ],
      );

    console.log("ODOO SEND RESULT");
    console.dir(sendResult, {
      depth: null,
    });
    console.log(
      `Odoo WhatsApp reservation confirmation queued for ${formattedPhone} using reservation_confirmation_v2.`,
    );

    return sendResult;
  } catch (error) {
    console.error(
      "WHATSAPP CONFIRMATION SEND FAILED",
    );
    console.error(error);

    if (error instanceof Error) {
      console.error("message:", error.message);
      console.error("stack:", error.stack);
    }

    throw error;
  }
}

// ---------------------------------------------------------
// Reservation → Odoo Appointments sync
// ---------------------------------------------------------

const RESERVATION_DURATION_MS =
  2 * 60 * 60 * 1000;

/**
 * Converts a Lagos-local date + time into an Odoo UTC datetime string.
 *
 * offsetMs shifts the result forward, so the stop time is derived
 * from a real timestamp rather than string arithmetic.
 */
function toOdooUtc(
  date: string,
  time: string,
  offsetMs = 0,
): string {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const dt = new Date(
    `${date}T00:00:00Z`,
  );

  dt.setUTCHours(
    hours -
      LAGOS_UTC_OFFSET_HOURS,
    minutes,
    0,
    0,
  );

  return new Date(
    dt.getTime() + offsetMs,
  )
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

const APPOINTMENT_TYPE_ID =
  Number(
    process.env
      .ODOO_APPOINTMENT_TYPE_ID,
  );

const DEFAULT_PARTNER_ID =
  Number(
    process.env
      .ODOO_DEFAULT_PARTNER_ID ??
      3,
  );

type ManyToOneRead =
  | [number, string]
  | false;

let cachedAppointmentProductId:
  | number
  | null = null;

/**
 * calendar.booking requires product_id.
 *
 * Rather than hardcoding an ID, read the product from the
 * appointment type so it stays correct across databases.
 */
async function getAppointmentProductId(): Promise<number> {
  if (
    cachedAppointmentProductId
  ) {
    return cachedAppointmentProductId;
  }

  const override =
    Number(
      process.env
        .ODOO_APPOINTMENT_PRODUCT_ID,
    );

  if (override) {
    cachedAppointmentProductId =
      override;

    return override;
  }

  const [apptType] =
    await odooCall<
      {
        product_id: ManyToOneRead;
      }[]
    >(
      "appointment.type",
      "read",
      [
        [
          APPOINTMENT_TYPE_ID,
        ],
        [
          "product_id",
        ],
      ],
    );

  const productField =
    apptType?.product_id;

  if (!productField) {
    throw new Error(
      `Appointment type ${APPOINTMENT_TYPE_ID} has no product_id set. Assign a product in Odoo (Appointments → Configuration → Appointment Types), or set ODOO_APPOINTMENT_PRODUCT_ID.`,
    );
  }

  cachedAppointmentProductId =
    productField[0];

  return cachedAppointmentProductId;
}

export async function pushReservationToOdoo(
  args: {
    reservationId: string;
    reservationCode?: string;
    name: string;
    phone?: string;
    partySize: number;
    date: string;
    time: string;
  },
): Promise<number> {
  const start = toOdooUtc(
    args.date,
    args.time,
  );

  const stop = toOdooUtc(
    args.date,
    args.time,
    RESERVATION_DURATION_MS,
  );

  const bookingName =
    `Table Reservation — ${args.name}${
      args.reservationCode
        ? ` [${args.reservationCode}]`
        : ""
    }`;

  const bookingId =
    await odooCall<number>(
      "calendar.booking",
      "create",
      [
        {
          appointment_type_id:
            APPOINTMENT_TYPE_ID,

          product_id:
            await getAppointmentProductId(),

          partner_id:
            DEFAULT_PARTNER_ID,

          start,

          stop,

          asked_capacity:
            args.partySize,

          name:
            bookingName,
        },
      ],
    );

  const [bookingRecord] =
    await odooCall<
      {
        calendar_event_id:
          ManyToOneRead;
      }[]
    >(
      "calendar.booking",
      "read",
      [
        [
          bookingId,
        ],
        [
          "calendar_event_id",
        ],
      ],
    );

  const eventField =
    bookingRecord?.calendar_event_id;

  if (!eventField) {
    throw new Error(
      `Odoo booking ${bookingId} was created but no calendar event was generated — check that appointment type ${APPOINTMENT_TYPE_ID} has auto-assignment enabled and a table was actually available.`,
    );
  }

  return eventField[0];
}

export async function updateReservationInOdoo(
  odooEventId: number,
  args: {
    date: string;
    time: string;
  },
): Promise<void> {
  const start =
    toOdooUtc(
      args.date,
      args.time,
    );

  const stop =
    toOdooUtc(
      args.date,
      args.time,
      RESERVATION_DURATION_MS,
    );

  await odooCall(
    "calendar.event",
    "write",
    [
      [
        odooEventId,
      ],
      {
        start,
        stop,
      },
    ],
  );
}

export async function deleteReservationFromOdoo(
  odooEventId: number,
): Promise<void> {
  await odooCall(
    "calendar.event",
    "unlink",
    [
      [
        odooEventId,
      ],
    ],
  );
}