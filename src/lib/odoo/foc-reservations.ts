const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

const META_FIELD =
  "x_studio_reservation_metadata_1";

const LAGOS_UTC_OFFSET_HOURS = 1;

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

type FocEvent = {
  id: number;
  name: string;
  start: string;
  stop: string;
  resource_ids: number[];
  appointment_status: string | false;
};

type AppointmentResource = {
  id: number;
  name: string;
  capacity: number;
};

export type FocSlot = {
  date: string;
  time: string;
};

async function getUid(): Promise<number> {
  if (cachedUid) {
    return cachedUid;
  }

  const response = await fetch(
    `${ODOO_URL}/jsonrpc`,
    {
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
        id: Date.now(),
      }),
      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as JsonRpcResult<number>;

  if (!data.result) {
    throw new Error(
      "Odoo authentication failed.",
    );
  }

  cachedUid = data.result;

  return cachedUid;
}

async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const uid = await getUid();

  const response = await fetch(
    `${ODOO_URL}/jsonrpc`,
    {
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

  const data =
    (await response.json()) as JsonRpcResult<T>;

  if (data.error) {
    throw new Error(
      data.error.data?.message ??
        data.error.message ??
        `Odoo ${model}.${method} failed`,
    );
  }

  return data.result as T;
}

function toOdooUtcDatetime(
  date: string,
  time: string,
): string {
  const [hours, minutes] =
    time.split(":").map(Number);

  const utcHours =
    hours - LAGOS_UTC_OFFSET_HOURS;

  const dt =
    new Date(`${date}T00:00:00Z`);

  dt.setUTCHours(
    utcHours,
    minutes,
    0,
    0,
  );

  return dt
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

function odooUtcToLagos(
  value: string,
): {
  date: string;
  time: string;
} {
  const parsed =
    new Date(
      `${value.replace(" ", "T")}Z`,
    );

  const lagos =
    new Date(
      parsed.getTime() +
        LAGOS_UTC_OFFSET_HOURS *
          60 *
          60 *
          1000,
    );

  return {
    date:
      lagos
        .toISOString()
        .slice(0, 10),

    time:
      lagos
        .toISOString()
        .slice(11, 16),
  };
}

function normalizePhone(
  phone: string,
): string {
  let value =
    phone.trim().replace(/\s+/g, "");

  if (value.startsWith("00")) {
    value = `+${value.slice(2)}`;
  }

  if (
    value.startsWith("0") &&
    !value.startsWith("+")
  ) {
    value =
      `+234${value.slice(1)}`;
  }

  if (
    !value.startsWith("+") &&
    /^\d+$/.test(value)
  ) {
    value = `+${value}`;
  }

  return value;
}

async function getOrCreatePartner(
  name: string,
  phone: string,
): Promise<number> {
  const existing =
    await odooCall<
      Array<{
        id: number;
        name: string;
        phone: string | false;
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

  if (existing.length > 0) {
    return existing[0].id;
  }

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

async function getResources(
  ids: number[],
): Promise<
  Map<number, AppointmentResource>
> {
  if (!ids.length) {
    return new Map();
  }

  const resources =
    await odooCall<
      AppointmentResource[]
    >(
      "appointment.resource",
      "read",
      [
        ids,
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


// =========================================================
// AVAILABLE FOC SLOTS
// =========================================================

export async function getFocSlots(): Promise<
  FocSlot[]
> {
  const events =
    await odooCall<FocEvent[]>(
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
        order: "start asc",
      },
    );

  const allowedTimes =
    new Set([
      "16:00",
      "19:00",
      "21:00",
    ]);

  const unique =
    new Map<string, FocSlot>();

  for (const event of events) {
    const slot =
      odooUtcToLagos(
        event.start,
      );

    if (
      !allowedTimes.has(
        slot.time,
      )
    ) {
      continue;
    }

    const key =
      `${slot.date}-${slot.time}`;

    unique.set(
      key,
      slot,
    );
  }

  return Array.from(
    unique.values(),
  );
}


// =========================================================
// CREATE FOC BOOKING
// =========================================================

export async function createFocReservation(
  input: {
    name: string;
    phone: string;
    partySize: number;
    date: string;
    time: string;
  },
): Promise<{
  success: boolean;
  error?: string;
  eventId?: number;
}> {
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

  if (!name) {
    return {
      success: false,
      error:
        "Name is required.",
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
    ![
      "16:00",
      "19:00",
      "21:00",
    ].includes(
      input.time,
    )
  ) {
    return {
      success: false,
      error:
        "Invalid FOC reservation time.",
    };
  }

  const start =
    toOdooUtcDatetime(
      input.date,
      input.time,
    );

  // Fresh read at booking time.
  const candidates =
    await odooCall<FocEvent[]>(
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
      },
    );

  if (!candidates.length) {
    return {
      success: false,
      error:
        "That FOC time is no longer available.",
    };
  }

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
      .map((event) => {
        const resourceId =
          event.resource_ids?.[0];

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
      })
      .filter(
        (
          item,
        ): item is {
          event: FocEvent;
          resource: AppointmentResource;
        } =>
          !!item.resource &&
          item.resource.capacity >=
            partySize,
      )
      .sort(
        (a, b) =>
          a.resource.capacity -
          b.resource.capacity,
      );

  if (!suitable.length) {
    return {
      success: false,
      error:
        `No FOC table is available for ${partySize} guests at that time.`,
    };
  }

  const selected =
    suitable[0];

  /**
   * Re-read selected event immediately before claiming.
   */
  const current =
    await odooCall<FocEvent[]>(
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
        ],
      ],
    );

  const event =
    current[0];

  if (
    !event ||
    !event.name
      .toLowerCase()
      .includes(
        "foc placeholder",
      ) ||
    event.appointment_status !==
      "request"
  ) {
    return {
      success: false,
      error:
        "That FOC table was just taken. Please choose another time.",
    };
  }

  const partnerId =
    await getOrCreatePartner(
      name,
      phone,
    );

  const metadata = {
    version: 1,
    reservationType:
      "foc",
    name,
    phone,
    partySize,
    date:
      input.date,
    time:
      input.time,
    status:
      "confirmed",
    eventIds: [
      event.id,
    ],
    resourceIds:
      event.resource_ids,
    createdAt:
      new Date()
        .toISOString(),
  };

  /**
   * Required event name:
   *
   * FOC / Joshua / +2348119239831
   */
  const eventName =
    `FOC / ${name} / ${phone}`;

  await odooCall<boolean>(
    "calendar.event",
    "write",
    [
      [
        event.id,
      ],
      {
        name:
          eventName,

        appointment_booker_id:
          partnerId,

        phone_number:
          phone,

        appointment_status:
          "booked",

        [META_FIELD]:
          JSON.stringify(
            metadata,
          ),
      },
    ],
  );

  console.log(
    "FOC reservation created",
    {
      eventId:
        event.id,
      name:
        eventName,
      partySize,
      date:
        input.date,
      time:
        input.time,
    },
  );

  return {
    success: true,
    eventId:
      event.id,
  };
}