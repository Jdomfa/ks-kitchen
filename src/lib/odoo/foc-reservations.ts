import {
  sendFocReservationWhatsApp,
} from "@/lib/odoo/foc-whatsapp";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

const RESERVATION_META_FIELD =
  "x_studio_reservation_metadata_1";

const LAGOS_UTC_OFFSET_HOURS = 1;

const FOC_TIMES = [
  "16:00",
  "19:00",
  "21:00",
];

let cachedUid: number | null = null;

type JsonRpcResult<T> = {
  result?: T;

  error?: {
    message?: string;

    data?: {
      message?: string;
      debug?: string;
    };
  };
};

type CalendarEventRecord = {
  id: number;
  name: string;
  start: string;
  stop: string;

  resource_ids: number[];

  appointment_status:
    | string
    | false;

  appointment_booker_id?:
    | [number, string]
    | false;

  phone_number?:
    | string
    | false;

  x_studio_reservation_metadata_1?:
    | string
    | false;
};

type AppointmentResourceRecord = {
  id: number;
  name: string;
  capacity: number;
};

export type FocSlot = {
  date: string;
  time: string;
};

export type CreateFocReservationInput = {
  name: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
};

export type CreateFocReservationResult = {
  success: boolean;

  error?: string;

  eventId?: number;

  reservationCode?: string;

  whatsappSent?: boolean;
};


/* ============================================================
 * Odoo JSON-RPC
 * ========================================================== */

async function getUid(): Promise<number> {
  if (cachedUid) {
    return cachedUid;
  }

  if (
    !ODOO_URL ||
    !ODOO_DB ||
    !ODOO_USERNAME ||
    !ODOO_API_KEY
  ) {
    throw new Error(
      "Missing Odoo environment variables.",
    );
  }

  const response =
    await fetch(
      `${ODOO_URL}/jsonrpc`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          jsonrpc: "2.0",

          method: "call",

          params: {
            service: "common",

            method:
              "authenticate",

            args: [
              ODOO_DB,
              ODOO_USERNAME,
              ODOO_API_KEY,
              {},
            ],
          },

          id: Date.now(),
        }),

        cache: "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      `Odoo authentication HTTP ${response.status}`,
    );
  }

  const data =
    (await response.json()) as JsonRpcResult<number>;

  if (
    data.error ||
    !data.result
  ) {
    throw new Error(
      data.error?.data?.message ??
        data.error?.message ??
        "Odoo authentication failed.",
    );
  }

  cachedUid =
    data.result;

  return cachedUid;
}


async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const uid =
    await getUid();

  const response =
    await fetch(
      `${ODOO_URL}/jsonrpc`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          jsonrpc: "2.0",

          method: "call",

          params: {
            service: "object",

            method:
              "execute_kw",

            args: [
              ODOO_DB,
              uid,
              ODOO_API_KEY,
              model,
              method,
              args,
              kwargs,
            ],
          },

          id: Date.now(),
        }),

        cache: "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      `Odoo ${model}.${method} HTTP ${response.status}`,
    );
  }

  const data =
    (await response.json()) as JsonRpcResult<T>;

  if (data.error) {
    console.error(
      "FOC Odoo JSON-RPC error",
      {
        model,
        method,
        args,
        kwargs,
        error:
          data.error,
      },
    );

    throw new Error(
      data.error.data?.message ??
        data.error.message ??
        `Odoo ${model}.${method} failed.`,
    );
  }

  return data.result as T;
}


/* ============================================================
 * Date helpers
 * ========================================================== */

function toOdooUtcDatetime(
  date: string,
  time: string,
): string {
  const [
    hours,
    minutes,
  ] =
    time
      .split(":")
      .map(Number);

  const utcHours =
    hours -
    LAGOS_UTC_OFFSET_HOURS;

  const value =
    new Date(
      `${date}T00:00:00Z`,
    );

  value.setUTCHours(
    utcHours,
    minutes,
    0,
    0,
  );

  return value
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}


function fromOdooUtcDatetime(
  value: string,
): {
  date: string;
  time: string;
} {
  const utcDate =
    new Date(
      `${value.replace(
        " ",
        "T",
      )}Z`,
    );

  const lagosDate =
    new Date(
      utcDate.getTime() +
        LAGOS_UTC_OFFSET_HOURS *
          60 *
          60 *
          1000,
    );

  return {
    date:
      lagosDate
        .toISOString()
        .slice(0, 10),

    time:
      lagosDate
        .toISOString()
        .slice(11, 16),
  };
}


/* ============================================================
 * Phone
 * ========================================================== */

function normalizePhone(
  raw: string,
): string {
  let phone =
    raw
      .trim()
      .replace(
        /[\s()-]/g,
        "",
      );

  if (
    phone.startsWith("00")
  ) {
    phone =
      `+${phone.slice(2)}`;
  }

  if (
    phone.startsWith("0")
  ) {
    phone =
      `+234${phone.slice(1)}`;
  }

  if (
    !phone.startsWith("+") &&
    /^\d+$/.test(phone)
  ) {
    phone =
      `+${phone}`;
  }

  return phone;
}


/* ============================================================
 * Partner
 * ========================================================== */

async function getOrCreatePartner(
  name: string,
  phone: string,
): Promise<number> {
  const existing =
    await odooCall<
      Array<{
        id: number;
        name: string;
        phone:
          | string
          | false;
      }>
    >(
      "res.partner",
      "search_read",
      [
        [
          [
            "phone",
            "=",
            phone,
          ],
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

  if (
    existing.length >
    0
  ) {
    return existing[0].id;
  }

  const partnerId =
    await odooCall<number>(
      "res.partner",
      "create",
      [
        {
          name,
          phone,
        },
      ],
    );

  console.log(
    "FOC Odoo partner created",
    {
      partnerId,
      name,
      phone,
    },
  );

  return partnerId;
}


/* ============================================================
 * Appointment resources
 * ========================================================== */

async function getResources(
  resourceIds: number[],
): Promise<
  Map<
    number,
    AppointmentResourceRecord
  >
> {
  if (
    resourceIds.length ===
    0
  ) {
    return new Map();
  }

  const resources =
    await odooCall<
      AppointmentResourceRecord[]
    >(
      "appointment.resource",
      "read",
      [
        resourceIds,
        [
          "id",
          "name",
          "capacity",
        ],
      ],
    );

  return new Map(
    resources.map(
      (resource) => [
        resource.id,
        resource,
      ],
    ),
  );
}


/* ============================================================
 * GET FOC availability from Odoo
 * ========================================================== */

export async function getFocSlots(
  partySize?: number,
): Promise<FocSlot[]> {
  const events =
    await odooCall<
      CalendarEventRecord[]
    >(
      "calendar.event",
      "search_read",
      [
        [
          [
            "name",
            "ilike",
            "FOC Placeholder",
          ],

          [
            "appointment_status",
            "=",
            "request",
          ],
        ],
      ],
      {
        fields: [
          "id",
          "name",
          "start",
          "stop",
          "resource_ids",
          "appointment_status",
        ],

        order:
          "start asc",
      },
    );

  let resourceMap =
    new Map<
      number,
      AppointmentResourceRecord
    >();

  if (
    partySize &&
    partySize > 0
  ) {
    const resourceIds =
      Array.from(
        new Set(
          events.flatMap(
            (event) =>
              event.resource_ids ??
              [],
          ),
        ),
      );

    resourceMap =
      await getResources(
        resourceIds,
      );
  }

  const uniqueSlots =
    new Map<
      string,
      FocSlot
    >();

  for (
    const event of events
  ) {
    if (
      event.appointment_status !==
      "request"
    ) {
      continue;
    }

    if (
      !event.name
        .toLowerCase()
        .includes(
          "foc placeholder",
        )
    ) {
      continue;
    }

    if (
      partySize &&
      partySize > 0
    ) {
      const resourceId =
        event.resource_ids?.[0];

      const resource =
        resourceId
          ? resourceMap.get(
              resourceId,
            )
          : undefined;

      if (
        !resource ||
        resource.capacity <
          partySize
      ) {
        continue;
      }
    }

    const local =
      fromOdooUtcDatetime(
        event.start,
      );

    if (
      !FOC_TIMES.includes(
        local.time,
      )
    ) {
      continue;
    }

    const key =
      `${local.date}-${local.time}`;

    uniqueSlots.set(
      key,
      local,
    );
  }

  return Array.from(
    uniqueSlots.values(),
  );
}


/* ============================================================
 * CREATE FOC reservation
 * ========================================================== */

export async function createFocReservation(
  input: CreateFocReservationInput,
): Promise<CreateFocReservationResult> {
  try {
    const name =
      input.name.trim();

    const phone =
      normalizePhone(
        input.phone,
      );

    const partySize =
      Number(
        input.partySize,
      );

    const date =
      input.date.trim();

    const time =
      input.time.trim();

    if (!name) {
      return {
        success: false,
        error:
          "Reservation name is required.",
      };
    }

    if (!phone) {
      return {
        success: false,
        error:
          "Phone number is required.",
      };
    }

    if (
      !Number.isInteger(
        partySize,
      ) ||
      partySize < 1 ||
      partySize > 4
    ) {
      return {
        success: false,
        error:
          "FOC reservations support 1 to 4 guests.",
      };
    }

    if (
      !date
    ) {
      return {
        success: false,
        error:
          "Reservation date is required.",
      };
    }

    if (
      !FOC_TIMES.includes(
        time,
      )
    ) {
      return {
        success: false,
        error:
          "Please choose 4 PM, 7 PM or 9 PM.",
      };
    }

    const start =
      toOdooUtcDatetime(
        date,
        time,
      );

    console.log(
      "=== FOC RESERVATION START ===",
      {
        name,
        phone,
        partySize,
        date,
        time,
        odooStart:
          start,
      },
    );


    /* --------------------------------------------------------
     * 1. Pull exact FOC placeholders from Odoo
     * ------------------------------------------------------ */

    const candidates =
      await odooCall<
        CalendarEventRecord[]
      >(
        "calendar.event",
        "search_read",
        [
          [
            [
              "name",
              "ilike",
              "FOC Placeholder",
            ],

            [
              "start",
              "=",
              start,
            ],

            [
              "appointment_status",
              "=",
              "request",
            ],
          ],
        ],
        {
          fields: [
            "id",
            "name",
            "start",
            "stop",
            "resource_ids",
            "appointment_status",
          ],

          order:
            "id asc",
        },
      );

    console.log(
      "FOC Odoo placeholders found",
      candidates.map(
        (event) => ({
          id:
            event.id,

          name:
            event.name,

          start:
            event.start,

          resources:
            event.resource_ids,

          status:
            event.appointment_status,
        }),
      ),
    );

    if (
      candidates.length ===
      0
    ) {
      return {
        success: false,
        error:
          "That FOC reservation time is no longer available.",
      };
    }


    /* --------------------------------------------------------
     * 2. Find smallest table that seats party
     * ------------------------------------------------------ */

    const resourceIds =
      Array.from(
        new Set(
          candidates.flatMap(
            (event) =>
              event.resource_ids ??
              [],
          ),
        ),
      );

    const resourceMap =
      await getResources(
        resourceIds,
      );

    const suitable =
      candidates
        .map(
          (event) => {
            const resourceId =
              event
                .resource_ids?.[0];

            const resource =
              resourceId
                ? resourceMap.get(
                    resourceId,
                  )
                : undefined;

            return {
              event,
              resource,
            };
          },
        )
        .filter(
          (
            item,
          ): item is {
            event: CalendarEventRecord;

            resource:
              AppointmentResourceRecord;
          } =>
            !!item.resource &&
            item.resource.capacity >=
              partySize,
        )
        .sort(
          (
            a,
            b,
          ) =>
            a.resource.capacity -
            b.resource.capacity,
        );

    if (
      suitable.length ===
      0
    ) {
      return {
        success: false,

        error:
          `No FOC table is available for ${partySize} ${
            partySize === 1
              ? "guest"
              : "guests"
          } at that time.`,
      };
    }

    const selected =
      suitable[0];

    console.log(
      "FOC selected table",
      {
        eventId:
          selected.event.id,

        resourceId:
          selected.resource.id,

        table:
          selected.resource.name,

        capacity:
          selected.resource.capacity,
      },
    );


    /* --------------------------------------------------------
     * 3. Re-read before claiming
     * ------------------------------------------------------ */

    const current =
      await odooCall<
        CalendarEventRecord[]
      >(
        "calendar.event",
        "read",
        [
          [
            selected.event.id,
          ],

          [
            "id",
            "name",
            "start",
            "stop",
            "resource_ids",
            "appointment_status",
            "appointment_booker_id",
            "phone_number",
            RESERVATION_META_FIELD,
          ],
        ],
      );

    const freshEvent =
      current[0];

    if (
      !freshEvent ||
      freshEvent.appointment_status !==
        "request" ||
      !freshEvent.name
        .toLowerCase()
        .includes(
          "foc placeholder",
        )
    ) {
      return {
        success: false,

        error:
          "That table was just taken. Please choose another available time.",
      };
    }


    /* --------------------------------------------------------
     * 4. Create / locate customer in Odoo
     * ------------------------------------------------------ */

    const partnerId =
      await getOrCreatePartner(
        name,
        phone,
      );

    console.log(
      "FOC Odoo partner",
      {
        partnerId,
        name,
        phone,
      },
    );


    /* --------------------------------------------------------
     * 5. Create FOC reference
     * ------------------------------------------------------ */

    const reservationCode =
      `FOC-${freshEvent.id}`;

    const eventName =
      `FOC / ${name} / ${phone}`;

    const metadata = {
      version: 1,

      reservationType:
        "foc",

      code:
        reservationCode,

      name,

      phone,

      partySize,

      date,

      time,

      status:
        "confirmed",

      partnerId,

      eventIds: [
        freshEvent.id,
      ],

      resourceIds:
        freshEvent.resource_ids,

      createdAt:
        new Date()
          .toISOString(),
    };


    /* --------------------------------------------------------
     * 6. ACTUALLY PUSH THE RESERVATION TO ODOO
     * ------------------------------------------------------ */

    console.log(
      "FOC writing reservation to Odoo",
      {
        eventId:
          freshEvent.id,

        eventName,

        partnerId,

        phone,
      },
    );

    const writeResult =
      await odooCall<boolean>(
        "calendar.event",
        "write",
        [
          [
            freshEvent.id,
          ],

          {
            name:
              eventName,

            appointment_status:
              "booked",

            appointment_booker_id:
              partnerId,

            phone_number:
              phone,

            [RESERVATION_META_FIELD]:
              JSON.stringify(
                metadata,
              ),
          },
        ],
      );

    if (
      writeResult !==
      true
    ) {
      throw new Error(
        "Odoo did not confirm the FOC calendar event update.",
      );
    }


    /* --------------------------------------------------------
     * 7. Verify Odoo write
     * ------------------------------------------------------ */

    const verification =
      await odooCall<
        CalendarEventRecord[]
      >(
        "calendar.event",
        "read",
        [
          [
            freshEvent.id,
          ],

          [
            "id",
            "name",
            "appointment_status",
            "appointment_booker_id",
            "phone_number",
            RESERVATION_META_FIELD,
          ],
        ],
      );

    const savedEvent =
      verification[0];

    if (
      !savedEvent ||
      savedEvent.name !==
        eventName ||
      savedEvent.appointment_status !==
        "booked"
    ) {
      console.error(
        "FOC Odoo verification failed",
        savedEvent,
      );

      throw new Error(
        "FOC reservation was not saved correctly in Odoo.",
      );
    }

    console.log(
      "=== FOC ODOO RESERVATION SAVED ===",
      {
        eventId:
          savedEvent.id,

        name:
          savedEvent.name,

        status:
          savedEvent.appointment_status,

        booker:
          savedEvent.appointment_booker_id,

        phone:
          savedEvent.phone_number,

        reservationCode,
      },
    );


    /* --------------------------------------------------------
     * 8. Send existing V3 WhatsApp template
     *
     * IMPORTANT:
     * Odoo reservation has ALREADY succeeded.
     * WhatsApp failure must not undo it.
     * ------------------------------------------------------ */

    let whatsappSent =
  false;

try {
  const whatsappResult =
    await sendFocReservationWhatsApp({
      name,
      phone,
      partySize,
      date,
      time,
      reservationCode,
    });

  whatsappSent =
    true;

  console.log(
    "FOC WhatsApp V3 success",
    whatsappResult,
  );
} catch (error) {
  console.error(
    "FOC WhatsApp V3 failed:",
    error,
  );
}


    /* --------------------------------------------------------
     * Success
     * ------------------------------------------------------ */

    return {
      success: true,

      eventId:
        freshEvent.id,

      reservationCode,

      whatsappSent,
    };
  } catch (
    error
  ) {
    console.error(
      "Reservation creation failed:",
      error,
    );

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Unable to create the reservation.",
    };
  }
}