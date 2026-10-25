const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;

const LAGOS_UTC_OFFSET_HOURS = 1;
const PUBLIC_PLACEHOLDER_NAME = "Public Placeholder";

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

let cachedUid: number | null = null;

async function getUid(): Promise<number> {
  if (cachedUid !== null) {
    return cachedUid;
  }

  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
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
        args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
      },
      id: Date.now(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Odoo authentication HTTP error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as JsonRpcResult<number>;

  if (!data.result) {
    throw new Error(
      data.error?.data?.message ||
        data.error?.message ||
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
  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
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
      id: Date.now(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Odoo HTTP error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as JsonRpcResult<T>;

  if (data.error) {
    const detail =
      data.error.data?.message ||
      data.error.data?.debug ||
      data.error.message ||
      "Unknown Odoo error";

    throw new Error(`Odoo error: ${detail}`);
  }

  if (data.result === undefined) {
    throw new Error(`Odoo returned no result for ${model}.${method}`);
  }

  return data.result;
}

function toOdooUtcDatetime(date: string, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(`Invalid time value: "${time}"`);
  }

  const dt = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(dt.getTime())) {
    throw new Error(`Invalid date value: "${date}"`);
  }

  dt.setUTCHours(hours - LAGOS_UTC_OFFSET_HOURS, minutes, 0, 0);

  return dt.toISOString().slice(0, 19).replace("T", " ");
}

function addDays(date: string, days: number): string {
  const dt = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(dt.getTime())) {
    throw new Error(`Invalid date value: "${date}"`);
  }

  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function formatOdooUtcTimeForLagos(value: string): string {
  const utc = new Date(`${value.replace(" ", "T")}Z`);

  if (Number.isNaN(utc.getTime())) {
    return value.slice(11, 16);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(utc);
}

export type PlaceholderOption = {
  eventId: number;
  label: string;

  time: string;
  start: string;
  stop: string;

  resourceId: number;
  resourceName: string;

  capacity: number;
  linkedResourceIds: number[];

  bookingLineIds: number[];
};

type CalendarEventRecord = {
  id: number;
  name: string;
  start: string;
  stop: string;

  resource_ids: number[];
  appointment_resource_ids: number[];
  booking_line_ids: number[];
};

type AppointmentResourceRecord = {
  id: number;
  name: string;
  capacity: number | false;
  linked_resource_ids: number[];
};

function getPrimaryResourceId(
  record: Pick<
    CalendarEventRecord,
    "resource_ids" | "appointment_resource_ids"
  >,
): number | undefined {
  return record.resource_ids?.[0] ?? record.appointment_resource_ids?.[0];
}

/**
 * Public website/WhatsApp reservation inventory.
 *
 * IMPORTANT:
 * This intentionally reads ONLY events whose name contains
 * "Public Placeholder". Family Placeholder events are excluded.
 */
export async function getPlaceholderInventoryForDate(
  date: string,
): Promise<PlaceholderOption[]> {
  const start = toOdooUtcDatetime(date, "00:00");
  const nextDate = addDays(date, 1);
  const stop = toOdooUtcDatetime(nextDate, "00:00");

  const records = await odooCall<CalendarEventRecord[]>(
    "calendar.event",
    "search_read",
    [
      [
        ["name", "ilike", PUBLIC_PLACEHOLDER_NAME],
        ["start", ">=", start],
        ["start", "<", stop],
      ],
    ],
    {
      fields: [
        "id",
        "name",
        "start",
        "stop",
        "resource_ids",
        "appointment_resource_ids",
        "booking_line_ids",
      ],
      order: "start asc, id asc",
    },
  );

  const resourceIds = Array.from(
    new Set(
      records
        .map((record) => getPrimaryResourceId(record))
        .filter((id): id is number => typeof id === "number"),
    ),
  );

  if (resourceIds.length === 0) {
    return [];
  }

  const resources = await odooCall<AppointmentResourceRecord[]>(
    "appointment.resource",
    "read",
    [resourceIds, ["id", "name", "capacity", "linked_resource_ids"]],
  );

  const resourceMap = new Map(
    resources.map((resource) => [resource.id, resource]),
  );

  const inventory: PlaceholderOption[] = [];

  for (const record of records) {
    const resourceId = getPrimaryResourceId(record);

    if (!resourceId) {
      continue;
    }

    const resource = resourceMap.get(resourceId);

    if (!resource) {
      continue;
    }

    const capacity =
      typeof resource.capacity === "number" ? resource.capacity : 0;

    if (capacity <= 0) {
      continue;
    }

    inventory.push({
      eventId: record.id,
      label: record.name || `${PUBLIC_PLACEHOLDER_NAME} ${record.id}`,

      time: formatOdooUtcTimeForLagos(record.start),
      start: record.start,
      stop: record.stop,

      resourceId,
      resourceName: resource.name,

      capacity,
      linkedResourceIds: resource.linked_resource_ids ?? [],

      bookingLineIds: record.booking_line_ids ?? [],
    });
  }

  return inventory;
}

/* ============================================================
 * Claim a placeholder (used by src/lib/reservations/slots.ts)
 * ========================================================== */

type CalendarFieldInfo = { hasStatus: boolean; bookedValue: string };

let calendarFieldInfo: CalendarFieldInfo | null = null;

/** Finds out whether this Odoo has appointment_status and what "Booked" is called. */
async function getCalendarFieldInfo(): Promise<CalendarFieldInfo> {
  if (calendarFieldInfo) {
    return calendarFieldInfo;
  }

  const info: CalendarFieldInfo = { hasStatus: false, bookedValue: "booked" };

  try {
    const fields = await odooCall<
      Record<string, { selection?: [string, string][] }>
    >("calendar.event", "fields_get", [["appointment_status"]], {
      attributes: ["selection"],
    });

    const status = fields.appointment_status;

    if (status) {
      info.hasStatus = true;

      const booked = status.selection?.find(
        ([key, label]) => key === "booked" || /booked/i.test(label),
      );

      if (booked) {
        info.bookedValue = booked[0];
      }
    }
  } catch (error) {
    console.error("Could not read calendar.event status field:", error);
  }

  calendarFieldInfo = info;

  return info;
}

type PartnerRecord = { id: number };

async function getOrCreatePartner(
  name: string,
  phone: string | undefined,
): Promise<number | false> {
  const cleanPhone = phone?.trim();

  if (!cleanPhone) {
    return false;
  }

  const existing = await odooCall<PartnerRecord[]>(
    "res.partner",
    "search_read",
    [[["phone", "=", cleanPhone]]],
    { fields: ["id"], limit: 1 },
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  return odooCall<number>("res.partner", "create", [
    {
      name: name.trim(),
      phone: cleanPhone,
      customer_rank: 1,
    },
  ]);
}

/** Event title: just "Name / Phone / Guests". */
function reservationTitle(
  name: string,
  phone: string | undefined,
  partySize: number | undefined,
): string {
  return [name.trim(), phone?.trim(), partySize]
    .filter((part) => part !== undefined && part !== "")
    .join(" / ");
}

/**
 * Turns a still-free "Public Placeholder" event into a booked reservation:
 *  - title becomes "Name / Phone / Guests"
 *  - status becomes Booked
 *  - the table's "people" number becomes the real guest count
 *
 * `partySize` is the whole party (for the title); `guests` is how many of
 * them sit at this event's table (differs only for merged tables).
 * Fails (without writing) if the event no longer looks like a free placeholder.
 */
export async function claimPlaceholder(
  eventId: number,
  details: {
    name: string;
    phone?: string;
    reservationCode?: string;
    partySize?: number;
    guests?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const events = await odooCall<
      Array<{ id: number; name: string; booking_line_ids?: number[] }>
    >("calendar.event", "read", [
      [eventId],
      ["id", "name", "booking_line_ids"],
    ]);

    if (events.length === 0) {
      return { success: false, error: "Placeholder event no longer exists." };
    }

    if (
      !events[0].name
        .toLowerCase()
        .includes(PUBLIC_PLACEHOLDER_NAME.toLowerCase())
    ) {
      return {
        success: false,
        error: "That table was just taken by another reservation.",
      };
    }

    const partnerId = await getOrCreatePartner(details.name, details.phone);
    const { hasStatus, bookedValue } = await getCalendarFieldInfo();

    await odooCall<boolean>("calendar.event", "write", [
      [eventId],
      {
        name: reservationTitle(details.name, details.phone, details.partySize),
        appointment_booker_id: partnerId,
        phone_number: details.phone?.trim() || false,
        description: false,
        ...(hasStatus ? { appointment_status: bookedValue } : {}),
      },
    ]);

    // Real guest count in the table's "people" number (best effort).
    const guests = details.guests ?? details.partySize;
    const lineIds = events[0].booking_line_ids ?? [];

    if (guests !== undefined && lineIds.length > 0) {
      try {
        await odooCall<boolean>("appointment.booking.line", "write", [
          [lineIds[0]],
          { capacity_reserved: guests },
        ]);
      } catch (error) {
        console.error("Could not set guest count on booking line:", error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("claimPlaceholder failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown claim error.",
    };
  }
}