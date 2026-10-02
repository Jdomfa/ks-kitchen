const ODOO_URL =
  process.env.ODOO_URL!;

const ODOO_DB =
  process.env.ODOO_DB!;

const ODOO_USERNAME =
  process.env.ODOO_USERNAME!;

const ODOO_API_KEY =
  process.env.ODOO_API_KEY!;

const DEFAULT_PARTNER_ID =
  Number(
    process.env
      .ODOO_DEFAULT_PARTNER_ID ??
      3
  );

const APPOINTMENT_TYPE_ID =
  Number(
    process.env
      .ODOO_APPOINTMENT_TYPE_ID ??
      1
  );

/* ============================================================
 * JSON-RPC
 * ========================================================== */

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

let cachedUid:
  number | null =
  null;

async function getUid(): Promise<number> {
  if (
    cachedUid !== null
  ) {
    return cachedUid;
  }

  const baseUrl =
    ODOO_URL.replace(
      /\/$/,
      ""
    );

  const res =
    await fetch(
      `${baseUrl}/jsonrpc`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            jsonrpc:
              "2.0",

            method:
              "call",

            params: {
              service:
                "common",

              method:
                "authenticate",

              args: [
                ODOO_DB,

                ODOO_USERNAME,

                ODOO_API_KEY,

                {},
              ],
            },
          }),

        cache:
          "no-store",
      }
    );

  if (!res.ok) {
    throw new Error(
      `Odoo authentication HTTP error: ${res.status} ${res.statusText}`
    );
  }

  const data =
    (await res.json()) as JsonRpcResult<number>;

  if (
    typeof data.result !==
    "number"
  ) {
    throw new Error(
      "Odoo authentication failed."
    );
  }

  cachedUid =
    data.result;

  return data.result;
}

async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<
    string,
    unknown
  > = {}
): Promise<T> {
  const baseUrl =
    ODOO_URL.replace(
      /\/$/,
      ""
    );

  const res =
    await fetch(
      `${baseUrl}/jsonrpc`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            jsonrpc:
              "2.0",

            method:
              "call",

            params: {
              service:
                "object",

              method:
                "execute_kw",

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

        cache:
          "no-store",
      }
    );

  if (!res.ok) {
    throw new Error(
      `Odoo HTTP error: ${res.status} ${res.statusText}`
    );
  }

  const data =
    (await res.json()) as JsonRpcResult<T>;

  if (data.error) {
    const detail =
      data.error.data
        ?.message ||
      data.error.data
        ?.debug ||
      data.error
        .message ||
      "Unknown Odoo error";

    throw new Error(
      `Odoo error: ${detail}`
    );
  }

  if (
    data.result ===
    undefined
  ) {
    throw new Error(
      `Odoo returned no result for ${model}.${method}`
    );
  }

  return data.result;
}

/* ============================================================
 * Types
 * ========================================================== */

export type Placeholder = {
  id: number;

  name: string;

  start: string;
  stop: string;

  capacity: number;

  available: boolean;

  partnerId:
    number | false;

  resourceId?:
    number;

  resourceName?:
    string;

  linkedResourceIds?:
    number[];

  appointmentStatus?:
    string | false;

  totalCapacityReserved?:
    number;

  totalCapacityUsed?:
    number;

  bookingLineIds?:
    number[];
};

export type PlaceholderOption = {
  eventId: number;

  label: string;

  start: string;
  stop: string;

  /**
   * Lagos local HH:mm
   */
  time: string;

  resourceId:
    number;

  resourceName:
    string;

  capacity:
    number;

  linkedResourceIds:
    number[];

  bookingLineIds:
    number[];
};

type CalendarEventRecord = {
  id: number;

  name: string;

  start: string;
  stop: string;

  partner_id:
    | [
        number,
        string
      ]
    | false;

  resource_ids:
    number[];

  appointment_resource_ids:
    number[];

  booking_line_ids:
    number[];

  appointment_status:
    | string
    | false;

  total_capacity_reserved:
    | number
    | false;

  total_capacity_used:
    | number
    | false;
};

type AppointmentResourceRecord = {
  id: number;

  name: string;

  capacity:
    | number
    | false;

  linked_resource_ids:
    number[];

  appointment_type_ids?:
    number[];
};

/* ============================================================
 * Date helpers
 * ========================================================== */

function assertDateOnly(
  date: string
): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    throw new Error(
      `Invalid date "${date}". Expected YYYY-MM-DD.`
    );
  }
}

function addDays(
  date: string,
  days: number
): string {
  assertDateOnly(
    date
  );

  const parsed =
    new Date(
      `${date}T00:00:00Z`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `Invalid date "${date}".`
    );
  }

  parsed.setUTCDate(
    parsed.getUTCDate() +
      days
  );

  return parsed
    .toISOString()
    .slice(
      0,
      10
    );
}

/**
 * Lagos is UTC+1.
 *
 * 18:00 Lagos
 * becomes
 * 17:00 UTC for Odoo.
 */
function toOdooUtcDatetime(
  date: string,
  time: string
): string {
  assertDateOnly(
    date
  );

  const match =
    /^(\d{2}):(\d{2})$/.exec(
      time
    );

  if (!match) {
    throw new Error(
      `Invalid time "${time}".`
    );
  }

  const hours =
    Number(
      match[1]
    );

  const minutes =
    Number(
      match[2]
    );

  const [
    year,
    month,
    day,
  ] =
    date
      .split("-")
      .map(Number);

  const millis =
    Date.UTC(
      year,

      month - 1,

      day,

      hours - 1,

      minutes,

      0,

      0
    );

  return new Date(
    millis
  )
    .toISOString()
    .slice(
      0,
      19
    )
    .replace(
      "T",
      " "
    );
}

function formatOdooUtcTimeForLagos(
  value: string
): string {
  const date =
    new Date(
      `${value.replace(
        " ",
        "T"
      )}Z`
    );

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone:
        "Africa/Lagos",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,
    }
  ).format(
    date
  );
}

/* ============================================================
 * Resource helpers
 * ========================================================== */

function isPlaceholderName(
  name: string
): boolean {
  return name
    .trim()
    .toLowerCase()
    .includes(
      "placeholder"
    );
}

function getPrimaryResourceId(
  record: Pick<
    CalendarEventRecord,
    | "resource_ids"
    | "appointment_resource_ids"
  >
): number | undefined {
  return (
    record.resource_ids?.[0] ??
    record
      .appointment_resource_ids?.[0]
  );
}

function getResourceCapacity(
  resource:
    | AppointmentResourceRecord
    | undefined
): number {
  if (
    !resource ||
    typeof resource.capacity !==
      "number"
  ) {
    return 0;
  }

  return resource.capacity;
}

async function getAppointmentResources(
  resourceIds: number[]
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

          "linked_resource_ids",

          "appointment_type_ids",
        ],
      ]
    );

  return new Map(
    resources.map(
      (
        resource
      ) => [
        resource.id,
        resource,
      ]
    )
  );
}

/* ============================================================
 * Dashboard / general event feed
 * ========================================================== */

export async function getAllPlaceholders(): Promise<
  Placeholder[]
> {
  const records =
    await odooCall<
      CalendarEventRecord[]
    >(
      "calendar.event",

      "search_read",

      [
        [
          [
            "appointment_type_id",
            "=",
            APPOINTMENT_TYPE_ID,
          ],
        ],

        [
          "id",

          "name",

          "start",

          "stop",

          "partner_id",

          "resource_ids",

          "appointment_resource_ids",

          "booking_line_ids",

          "appointment_status",

          "total_capacity_reserved",

          "total_capacity_used",
        ],
      ],

      {
        order:
          "start asc",
      }
    );

  const resourceIds =
    Array.from(
      new Set(
        records.flatMap(
          (
            record
          ) => [
            ...(
              record.resource_ids ??
              []
            ),

            ...(
              record
                .appointment_resource_ids ??
              []
            ),
          ]
        )
      )
    );

  const resourceMap =
    await getAppointmentResources(
      resourceIds
    );

  return records.map(
    (
      record
    ) => {
      const resourceId =
        getPrimaryResourceId(
          record
        );

      const resource =
        resourceId
          ? resourceMap.get(
              resourceId
            )
          : undefined;

      return {
        id:
          record.id,

        name:
          record.name,

        start:
          record.start,

        stop:
          record.stop,

        capacity:
          getResourceCapacity(
            resource
          ),

        available:
          isPlaceholderName(
            record.name
          ),

        partnerId:
          record.partner_id
            ? record
                .partner_id[0]
            : false,

        resourceId,

        resourceName:
          resource?.name,

        linkedResourceIds:
          resource
            ?.linked_resource_ids ??
          [],

        appointmentStatus:
          record
            .appointment_status,

        totalCapacityReserved:
          typeof record
            .total_capacity_reserved ===
          "number"
            ? record
                .total_capacity_reserved
            : 0,

        totalCapacityUsed:
          typeof record
            .total_capacity_used ===
          "number"
            ? record
                .total_capacity_used
            : 0,

        bookingLineIds:
          record
            .booking_line_ids ??
          [],
      };
    }
  );
}

/* ============================================================
 * Reservation inventory
 * ========================================================== */

/**
 * Returns ALL free placeholder tables for this date.
 *
 * Notice there is NO party-size filter here.
 *
 * That is critical for merging.
 */
export async function getPlaceholderInventoryForDate(
  date: string
): Promise<
  PlaceholderOption[]
> {
  assertDateOnly(
    date
  );

  const startOfDay =
    toOdooUtcDatetime(
      date,
      "00:00"
    );

  const nextDate =
    addDays(
      date,
      1
    );

  const endOfDay =
    toOdooUtcDatetime(
      nextDate,
      "00:00"
    );

  const records =
    await odooCall<
      CalendarEventRecord[]
    >(
      "calendar.event",

      "search_read",

      [
        [
          [
            "appointment_type_id",
            "=",
            APPOINTMENT_TYPE_ID,
          ],

          [
            "name",
            "ilike",
            "Placeholder",
          ],

          [
            "start",
            ">=",
            startOfDay,
          ],

          [
            "start",
            "<",
            endOfDay,
          ],
        ],

        [
          "id",

          "name",

          "start",

          "stop",

          "partner_id",

          "resource_ids",

          "appointment_resource_ids",

          "booking_line_ids",

          "appointment_status",

          "total_capacity_reserved",

          "total_capacity_used",
        ],
      ],

      {
        order:
          "start asc, id asc",
      }
    );

  const resourceIds =
    Array.from(
      new Set(
        records.flatMap(
          (
            record
          ) => [
            ...(
              record.resource_ids ??
              []
            ),

            ...(
              record
                .appointment_resource_ids ??
              []
            ),
          ]
        )
      )
    );

  const resourceMap =
    await getAppointmentResources(
      resourceIds
    );

  const options:
    PlaceholderOption[] =
    [];

  for (
    const record of
      records
  ) {
    const resourceId =
      getPrimaryResourceId(
        record
      );

    if (
      !resourceId
    ) {
      continue;
    }

    const resource =
      resourceMap.get(
        resourceId
      );

    if (
      !resource
    ) {
      continue;
    }

    const capacity =
      getResourceCapacity(
        resource
      );

    if (
      capacity <= 0
    ) {
      continue;
    }

    options.push({
      eventId:
        record.id,

      label:
        record.name,

      start:
        record.start,

      stop:
        record.stop,

      time:
        formatOdooUtcTimeForLagos(
          record.start
        ),

      resourceId,

      resourceName:
        resource.name,

      capacity,

      linkedResourceIds:
        resource
          .linked_resource_ids ??
        [],

      bookingLineIds:
        record
          .booking_line_ids ??
        [],
    });
  }

  return options;
}

/* ============================================================
 * Dashboard tester compatibility
 * ========================================================== */

export async function findAvailablePlaceholders(
  date: string,
  partySize: number
): Promise<
  PlaceholderOption[]
> {
  const inventory =
    await getPlaceholderInventoryForDate(
      date
    );

  return inventory
    .filter(
      (
        option
      ) =>
        option.capacity >=
        partySize
    )
    .sort(
      (
        a,
        b
      ) => {
        if (
          a.start !==
          b.start
        ) {
          return a.start.localeCompare(
            b.start
          );
        }

        if (
          a.capacity !==
          b.capacity
        ) {
          return (
            a.capacity -
            b.capacity
          );
        }

        return (
          a.resourceId -
          b.resourceId
        );
      }
    );
}

/* ============================================================
 * Claim one placeholder
 * ========================================================== */

export async function claimPlaceholder(
  eventId: number,

  details: {
    name: string;

    phone?: string;

    reservationCode?:
      string;

    partnerId?:
      number;
  }
): Promise<{
  success: boolean;

  error?: string;
}> {
  const [
    current,
  ] =
    await odooCall<
      CalendarEventRecord[]
    >(
      "calendar.event",

      "read",

      [
        [
          eventId,
        ],

        [
          "id",

          "name",

          "start",

          "stop",

          "partner_id",

          "resource_ids",

          "appointment_resource_ids",

          "booking_line_ids",

          "appointment_status",

          "total_capacity_reserved",

          "total_capacity_used",
        ],
      ]
    );

  if (
    !current
  ) {
    return {
      success:
        false,

      error:
        "The reservation slot no longer exists.",
    };
  }

  /**
   * The name is currently our inventory marker.
   *
   * Once another reservation converts it, it no longer qualifies.
   */
  if (
    !isPlaceholderName(
      current.name
    )
  ) {
    return {
      success:
        false,

      error:
        "That table was just taken by another reservation.",
    };
  }

  const displayName =
    `Table Reservation — ${details.name.trim()}` +
    (
      details.reservationCode
        ? ` [${details.reservationCode}]`
        : ""
    );

  const partnerId =
    details.partnerId ??
    DEFAULT_PARTNER_ID;

  /**
   * Only use event fields we have already seen on this database.
   *
   * We deliberately do NOT modify booking_line_ids here yet.
   */
  const written =
    await odooCall<boolean>(
      "calendar.event",

      "write",

      [
        [
          eventId,
        ],

        {
          name:
            displayName,

          partner_id:
            partnerId,

          appointment_booker_id:
            partnerId,

          phone_number:
            details.phone?.trim() ||
            false,
        },
      ]
    );

  if (
    !written
  ) {
    return {
      success:
        false,

      error:
        "Odoo did not confirm the event update.",
    };
  }

  return {
    success:
      true,
  };
}