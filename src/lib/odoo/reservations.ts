import { odooCall, odooUtcRange } from "@/lib/odoo/rpc";
import {
  findBestAllocation,
  type ReservationAllocation,
} from "@/lib/odoo/reservation-allocation";
import { RESERVATION_DURATION_HOURS } from "@/lib/reservations/time-slots";

export type { ReservationAllocation };

const RESERVATION_META_FIELD = "x_studio_reservation_metadata_1";
const APPOINTMENT_TYPE_ID = Number(process.env.ODOO_APPOINTMENT_TYPE_ID);
const INCLUDE_ARCHIVED = { context: { active_test: false } };

let hasStatusField = false;
let bookedStatusValue = "booked";
let validated = false;

type Many2One = [number, string] | false;

type ReservationMetadata = {
  version: 3;
  code: string;
  name: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  status: "confirmed" | "cancelled";
  partnerId: number;
  eventIds: number[];
  resourceIds: number[];
  allocationType: "single" | "merged";
  createdAt: string;
  updatedAt: string;
};

type CalendarEventRecord = {
  id: number;
  name: string;
  start: string;
  stop: string;
  phone_number?: string | false;
  appointment_booker_id: Many2One;
  x_studio_reservation_metadata_1?: string | false;
  [key: string]: unknown;
};

type PartnerRecord = { id: number; name: string; phone: string | false };

export type ReservationLookupResult = {
  success: boolean;
  reservation_id?: string;
  reservation_code?: string;
  name?: string;
  phone?: string;
  party_size?: number;
  reservation_date?: string;
  reservation_time?: string;
  status?: string;
  event_ids?: number[];
  error?: string;
  multiple?: boolean;
  // Camel-case aliases used by reservationFlow.ts.
  reservationId?: string;
  reservationCode?: string;
  partySize?: number;
  date?: string;
  time?: string;
};

export type CreateReservationInput = {
  name: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
};

/* ============================================================
 * Validation
 * ========================================================== */

async function validateOdooFields() {
  if (validated) return;

  if (!Number.isInteger(APPOINTMENT_TYPE_ID) || APPOINTMENT_TYPE_ID <= 0) {
    throw new Error("ODOO_APPOINTMENT_TYPE_ID is missing or invalid.");
  }

  const fields = await odooCall<Record<string, unknown>>(
    "calendar.event",
    "fields_get",
    [],
    { attributes: ["string", "type", "readonly", "selection"] },
  );

  if (!fields[RESERVATION_META_FIELD]) {
    throw new Error(`Missing calendar.event field: ${RESERVATION_META_FIELD}`);
  }
  if (!fields.appointment_booker_id) {
    throw new Error("calendar.event does not expose appointment_booker_id.");
  }

  const statusField = fields.appointment_status as
    | { selection?: [string, string][] }
    | undefined;
  hasStatusField = Boolean(statusField);

  const booked = statusField?.selection?.find(
    ([key, label]) => key === "booked" || /booked/i.test(label),
  );
  if (booked) bookedStatusValue = booked[0];

  validated = true;
}

/* ============================================================
 * Helpers
 * ========================================================== */

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = `234${digits.slice(1)}`;
  }
  return digits;
}

function phoneVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const local = normalized.startsWith("234")
    ? `0${normalized.slice(3)}`
    : normalized;
  return Array.from(
    new Set([phone.trim(), normalized, local, `+${normalized}`]),
  );
}

function makeReservationCode(): string {
  const random = Math.random()
    .toString(16)
    .slice(2, 8)
    .toUpperCase()
    .padEnd(6, "0");
  return `KK-${random}`;
}

/** Plain JSON so the code can be searched in Odoo. */
function encodeMetadata(metadata: ReservationMetadata): string {
  return JSON.stringify(metadata);
}

/**
 * Reads version 3 metadata, and also version 2 (old placeholder-era) values,
 * so existing reservations can still be looked up and cancelled.
 */
function decodeMetadata(
  raw: string | false | undefined,
): ReservationMetadata | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw.trim()) as ReservationMetadata;
  } catch {
    return null;
  }
}

/** Event title: "Name / Phone / Guests". */
function reservationTitle(name: string, phone: string, partySize: number) {
  return `${name} / ${phone} / ${partySize}`;
}

async function findPartnerByPhone(phone: string): Promise<PartnerRecord | null> {
  for (const variant of phoneVariants(phone)) {
    const records = await odooCall<PartnerRecord[]>(
      "res.partner",
      "search_read",
      [[["phone", "=ilike", variant]]],
      { fields: ["id", "name", "phone"], limit: 1 },
    );
    if (records.length > 0) return records[0];
  }
  return null;
}

async function getOrCreateCustomerPartner(input: {
  name: string;
  phone: string;
}): Promise<number> {
  const existing = await findPartnerByPhone(input.phone);
  if (existing) return existing.id;

  return odooCall<number>("res.partner", "create", [
    { name: input.name.trim(), phone: input.phone.trim(), customer_rank: 1 },
  ]);
}

const EVENT_FIELDS = [
  "id",
  "name",
  "start",
  "stop",
  "phone_number",
  "appointment_booker_id",
  RESERVATION_META_FIELD,
];

/* ============================================================
 * Booking: creates the calendar events directly (no placeholders)
 * ========================================================== */

async function bookEvents(
  allocation: ReservationAllocation,
  input: {
    code: string;
    name: string;
    phone: string;
    partySize: number;
    date: string;
    time: string;
    partnerId: number;
    createdAt: string;
  },
): Promise<number[]> {
  const { start, stop } = odooUtcRange(
    input.date,
    input.time,
    RESERVATION_DURATION_HOURS,
  );

  const title = reservationTitle(input.name, input.phone, input.partySize);
  const createdIds: number[] = [];

  try {
    // One event per table. For merged tables the party is split across them.
    let remaining = input.partySize;

    for (let i = 0; i < allocation.resources.length; i++) {
      const resource = allocation.resources[i];
      const isLast = i === allocation.resources.length - 1;
      const share = isLast ? remaining : Math.min(resource.capacity, remaining);
      remaining -= share;

      const id = await odooCall<number>(
        "calendar.event",
        "create",
        [
          {
            name: title,
            start,
            stop,
            allday: false,
            appointment_type_id: APPOINTMENT_TYPE_ID,
            appointment_booker_id: input.partnerId,
            phone_number: input.phone,
            booking_line_ids: [
              [
                0,
                0,
                {
                  appointment_resource_id: resource.id,
                  capacity_reserved: share,
                },
              ],
            ],
            ...(hasStatusField ? { appointment_status: bookedStatusValue } : {}),
          },
        ],
        { context: { dont_notify: true } },
      );

      createdIds.push(id);
    }

    // Required data lives in the Studio metadata field on every event.
    const metadata: ReservationMetadata = {
      version: 3,
      code: input.code,
      name: input.name,
      phone: input.phone,
      partySize: input.partySize,
      date: input.date,
      time: input.time,
      status: "confirmed",
      partnerId: input.partnerId,
      eventIds: createdIds,
      resourceIds: allocation.resources.map((r) => r.id),
      allocationType: allocation.type,
      createdAt: input.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await odooCall<boolean>("calendar.event", "write", [
      createdIds,
      { [RESERVATION_META_FIELD]: encodeMetadata(metadata) },
    ]);

    return createdIds;
  } catch (error) {
    if (createdIds.length > 0) {
      try {
        await odooCall<boolean>("calendar.event", "unlink", [createdIds]);
      } catch (rollbackError) {
        console.error("Booking rollback failed:", rollbackError);
      }
    }
    throw error;
  }
}

/* ============================================================
 * Create reservation
 * ========================================================== */

export async function createOdooReservation(
  input: CreateReservationInput,
): Promise<{
  success: boolean;
  reservation_id?: string;
  reservationId?: string;
  reservation_code?: string;
  reservationCode?: string;
  event_ids?: number[];
  error?: string;
  reason?: string;
}> {
  try {
    await validateOdooFields();

    const name = input.name.trim();
    const phone = input.phone.trim();
    const partySize = Number(input.partySize);

    if (!name) return { success: false, error: "Customer name is required." };
    if (phone.replace(/\D/g, "").length < 9) {
      return { success: false, error: "A valid phone number is required." };
    }
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
      return { success: false, error: "Automated reservations support 1–4 guests." };
    }

    // Check availability right before writing.
    const allocation = await findBestAllocation(input.date, input.time, partySize);
    if (!allocation) {
      return {
        success: false,
        reason: "unavailable",
        error: "That reservation time is no longer available.",
      };
    }

    const partnerId = await getOrCreateCustomerPartner({ name, phone });
    const code = makeReservationCode();

    const eventIds = await bookEvents(allocation, {
      code,
      name,
      phone,
      partySize,
      date: input.date,
      time: input.time,
      partnerId,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      reservation_id: String(eventIds[0]),
      reservationId: String(eventIds[0]),
      reservation_code: code,
      reservationCode: code,
      event_ids: eventIds,
    };
  } catch (error) {
    console.error("createOdooReservation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown reservation error.",
    };
  }
}

/* ============================================================
 * Lookups
 * ========================================================== */

async function findReservationEventsByCode(
  code: string,
): Promise<CalendarEventRecord[]> {
  await validateOdooFields();
  const normalized = code.trim().toUpperCase();

  return odooCall<CalendarEventRecord[]>(
    "calendar.event",
    "search_read",
    [[[RESERVATION_META_FIELD, "ilike", `"code":"${normalized}"`]]],
    { fields: EVENT_FIELDS, order: "start asc", ...INCLUDE_ARCHIVED },
  );
}

function lookupResult(
  event: CalendarEventRecord,
  metadata: ReservationMetadata,
  multiple?: boolean,
): ReservationLookupResult {
  return {
    success: true,
    reservation_id: String(event.id),
    reservationId: String(event.id),
    reservation_code: metadata.code,
    reservationCode: metadata.code,
    name: metadata.name,
    phone: metadata.phone,
    party_size: metadata.partySize,
    partySize: metadata.partySize,
    reservation_date: metadata.date,
    date: metadata.date,
    reservation_time: metadata.time,
    time: metadata.time,
    status: metadata.status,
    event_ids: metadata.eventIds,
    ...(multiple !== undefined ? { multiple } : {}),
  };
}

export async function getOdooReservationByCode(
  code: string,
): Promise<ReservationLookupResult> {
  try {
    const events = await findReservationEventsByCode(code);
    if (events.length === 0) {
      return { success: false, error: "Reservation not found." };
    }

    const metadata = decodeMetadata(events[0][RESERVATION_META_FIELD]);
    if (!metadata) {
      return { success: false, error: "Reservation metadata could not be read." };
    }

    return lookupResult(events[0], metadata);
  } catch (error) {
    console.error("getOdooReservationByCode failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown lookup error.",
    };
  }
}

export async function getOdooReservationByPhone(
  phone: string,
): Promise<ReservationLookupResult> {
  try {
    await validateOdooFields();
    const normalized = normalizePhone(phone);

    const events = await odooCall<CalendarEventRecord[]>(
      "calendar.event",
      "search_read",
      [[[RESERVATION_META_FIELD, "!=", false]]],
      {
        fields: EVENT_FIELDS,
        order: "start desc",
        limit: 500,
        ...INCLUDE_ARCHIVED,
      },
    );

    const matches: Array<{
      event: CalendarEventRecord;
      metadata: ReservationMetadata;
    }> = [];
    const seen = new Set<string>();

    for (const event of events) {
      const metadata = decodeMetadata(event[RESERVATION_META_FIELD]);
      if (!metadata) continue;
      if (normalizePhone(metadata.phone) !== normalized) continue;
      if (seen.has(metadata.code)) continue;
      seen.add(metadata.code);
      matches.push({ event, metadata });
    }

    if (matches.length === 0) {
      return {
        success: false,
        error: "No reservation was found for that phone number.",
      };
    }

    const confirmed = matches.filter((m) => m.metadata.status === "confirmed");
    const selected = confirmed[0] ?? matches[0];

    return lookupResult(selected.event, selected.metadata, matches.length > 1);
  } catch (error) {
    console.error("getOdooReservationByPhone failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown phone lookup error.",
    };
  }
}

/* ============================================================
 * Cancel reservation
 * ========================================================== */

/**
 * Marks the metadata cancelled and archives the events. Archived events no
 * longer block the table (availability only reads active events), and the
 * record + metadata stay in Odoo for history.
 */
export async function cancelOdooReservationByCode(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const events = await findReservationEventsByCode(code);
    if (events.length === 0) {
      return { success: false, error: "Reservation not found." };
    }

    const metadata = decodeMetadata(events[0][RESERVATION_META_FIELD]);
    if (!metadata) {
      return { success: false, error: "Reservation metadata could not be read." };
    }

    if (metadata.status === "cancelled") return { success: true };

    const cancelled: ReservationMetadata = {
      ...metadata,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };

    await odooCall<boolean>(
      "calendar.event",
      "write",
      [
        events.map((e) => e.id),
        { [RESERVATION_META_FIELD]: encodeMetadata(cancelled), active: false },
      ],
      INCLUDE_ARCHIVED,
    );

    return { success: true };
  } catch (error) {
    console.error("cancelOdooReservationByCode failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown cancellation error.",
    };
  }
}

/* ============================================================
 * Modify reservation
 * ========================================================== */

export async function modifyOdooReservation(
  code: string,
  newDate: string,
  newTime: string,
): Promise<{ success: boolean; error?: string; reason?: string }> {
  try {
    await validateOdooFields();

    const oldEvents = await findReservationEventsByCode(code);
    if (oldEvents.length === 0) {
      return { success: false, error: "Reservation not found." };
    }

    const old = decodeMetadata(oldEvents[0][RESERVATION_META_FIELD]);
    if (!old) {
      return { success: false, error: "Reservation metadata could not be read." };
    }
    if (old.status === "cancelled") {
      return { success: false, error: "That reservation has been cancelled." };
    }

    if (old.date === newDate && old.time === newTime) return { success: true };

    // Ignore our own current booking when checking the new slot.
    const allocation = await findBestAllocation(newDate, newTime, old.partySize, {
      excludeEventIds: old.eventIds,
    });
    if (!allocation) {
      return {
        success: false,
        reason: "unavailable",
        error: "The requested new time is no longer available.",
      };
    }

    // Book the new slot first, then release the old one.
    const newEventIds = await bookEvents(allocation, {
      code: old.code,
      name: old.name,
      phone: old.phone,
      partySize: old.partySize,
      date: newDate,
      time: newTime,
      partnerId: old.partnerId,
      createdAt: old.createdAt,
    });

    try {
      await odooCall<boolean>(
        "calendar.event",
        "unlink",
        [old.eventIds],
        INCLUDE_ARCHIVED,
      );
    } catch (releaseError) {
      console.error("Failed releasing previous reservation slots:", releaseError);
      try {
        await odooCall<boolean>("calendar.event", "unlink", [newEventIds]);
      } catch (rollbackError) {
        console.error("Reservation modification rollback failed:", rollbackError);
      }
      return { success: false, error: "The reservation could not be moved safely." };
    }

    return { success: true };
  } catch (error) {
    console.error("modifyOdooReservation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown modification error.",
    };
  }
}

/* ============================================================
 * Kept so existing imports don't break
 * ========================================================== */

export async function colorizeExistingPlaceholders() {
  return { success: true, updated: 0 };
}

export async function migrateLegacyReservationMetadata() {
  return { success: true, migrated: 0 };
}

export const createReservation = createOdooReservation;
export const getReservationByCode = getOdooReservationByCode;
export const getReservationByPhone = getOdooReservationByPhone;
export const cancelReservationByCode = cancelOdooReservationByCode;
export const modifyReservation = modifyOdooReservation;
export const cancelOdooReservation = cancelOdooReservationByCode;

export async function debugReservationByCode(code: string) {
  const events = await findReservationEventsByCode(code);
  return events.map((event) => ({
    id: event.id,
    name: event.name,
    appointmentBooker: event.appointment_booker_id,
    phone: event.phone_number,
    metadata: decodeMetadata(event[RESERVATION_META_FIELD]),
  }));
}