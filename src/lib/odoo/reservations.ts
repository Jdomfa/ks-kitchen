import {
  findBestAllocation,
  type ReservationAllocation,
} from "@/lib/odoo/reservation-allocation";

export type { ReservationAllocation };

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const ODOO_USERNAME = process.env.ODOO_USERNAME!;
const ODOO_API_KEY = process.env.ODOO_API_KEY!;
const RESERVATION_META_FIELD = "x_studio_reservation_metadata_1";
const LEGACY_META_PREFIX = "KK_RESERVATION_META:";
const RESERVATION_NAME_PREFIX = "Table Reservation — ";
const PUBLIC_PLACEHOLDER_NAME = "Public Placeholder";
/**
 * The "people" number shown on the Odoo calendar event form.
 * Written best-effort: skipped if this database doesn't have the field.
 */
const CAPACITY_FIELD = "resource_total_capacity_reserved";
let hasCapacityField = false;
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
type Many2One = [number, string] | false;
type OriginalEventState = {
  id: number;
  name: string;
  description: string | false;
  appointmentBookerId: number | false;
  phoneNumber: string | false;
  capacityReserved?: number | false;
};
type ReservationMetadata = {
  version: 2;
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
  originalEvents: OriginalEventState[];
  createdAt: string;
  updatedAt: string;
};
type CalendarEventRecord = {
  id: number;
  name: string;
  start: string;
  stop: string;
  description: string | false;
  phone_number?: string | false;
  appointment_booker_id: Many2One;
  appointment_resource_ids: number[];
  booking_line_ids: number[];
  x_studio_reservation_metadata_1?: string | false;
  [key: string]: unknown;
};
type PartnerRecord = {
  id: number;
  name: string;
  phone: string | false;
};
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
let cachedUid: number | null = null;
/* ============================================================
 * Authentication
 * ========================================================== */
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
  const data = (await response.json()) as JsonRpcResult<number>;
  if (data.error || !data.result) {
    throw new Error(
      data.error?.data?.message ||
        data.error?.message ||
        "Odoo authentication failed.",
    );
  }
  cachedUid = data.result;
  return cachedUid;
}
/* ============================================================
 * JSON-RPC
 * ========================================================== */
async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const uid = await getUid();
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
        args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs],
      },
      id: Date.now(),
    }),
    cache: "no-store",
  });
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
/* ============================================================
 * Validation
 * ========================================================== */
async function validateOdooFields() {
  const fields = await odooCall<Record<string, unknown>>(
    "calendar.event",
    "fields_get",
    [],
    {
      attributes: ["string", "type", "readonly"],
    },
  );
  if (!fields[RESERVATION_META_FIELD]) {
    throw new Error(`Missing calendar.event field: ${RESERVATION_META_FIELD}`);
  }
  if (!fields.appointment_booker_id) {
    throw new Error("calendar.event does not expose appointment_booker_id.");
  }
  hasCapacityField = Boolean(fields[CAPACITY_FIELD]);
}
/* ============================================================
 * Phone helpers
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
/* ============================================================
 * Reservation code
 * ========================================================== */
function makeReservationCode(): string {
  const random = Math.random()
    .toString(16)
    .slice(2, 8)
    .toUpperCase()
    .padEnd(6, "0");
  return `KK-${random}`;
}
/* ============================================================
 * Metadata
 * ========================================================== */
function encodeMetadata(metadata: ReservationMetadata): string {
  return Buffer.from(JSON.stringify(metadata), "utf8").toString("base64url");
}
function decodeMetadata(
  raw: string | false | undefined,
): ReservationMetadata | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  let encoded = raw.trim();
  if (encoded.startsWith(LEGACY_META_PREFIX)) {
    encoded = encoded.slice(LEGACY_META_PREFIX.length);
  }
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    return JSON.parse(json) as ReservationMetadata;
  } catch {
    return null;
  }
}
function extractLegacyMetadata(
  description: string | false,
): ReservationMetadata | null {
  if (typeof description !== "string") {
    return null;
  }
  const index = description.indexOf(LEGACY_META_PREFIX);
  if (index < 0) {
    return null;
  }
  let encoded = description.slice(index + LEGACY_META_PREFIX.length);
  /**
   * Odoo HTML fields can sometimes wrap values.
   * Only take the first visible line/tag section.
   */
  encoded = encoded.split("<")[0].split("\n")[0].trim();
  return decodeMetadata(encoded);
}
function getMetadataFromEvent(
  event: CalendarEventRecord,
): ReservationMetadata | null {
  const studioValue = event[RESERVATION_META_FIELD];
  if (typeof studioValue === "string" && studioValue.trim()) {
    const parsed = decodeMetadata(studioValue);
    if (parsed) {
      return parsed;
    }
  }
  return extractLegacyMetadata(event.description);
}
/* ============================================================
 * Partners / appointment booker
 * ========================================================== */
async function findPartnerByPhone(
  phone: string,
): Promise<PartnerRecord | null> {
  for (const variant of phoneVariants(phone)) {
    const records = await odooCall<PartnerRecord[]>(
      "res.partner",
      "search_read",
      [[["phone", "=ilike", variant]]],
      {
        fields: ["id", "name", "phone"],
        limit: 1,
      },
    );
    if (records.length > 0) {
      return records[0];
    }
  }
  return null;
}
async function getOrCreateCustomerPartner({
  name,
  phone,
}: {
  name: string;
  phone: string;
}): Promise<number> {
  const existing = await findPartnerByPhone(phone);
  if (existing) {
    return existing.id;
  }
  return odooCall<number>("res.partner", "create", [
    {
      name: name.trim(),
      phone: phone.trim(),
      customer_rank: 1,
    },
  ]);
}
/* ============================================================
 * Allocation
 * ========================================================== */
async function findAllocation(
  date: string,
  time: string,
  partySize: number,
): Promise<ReservationAllocation | null> {
  return findBestAllocation(date, time, partySize);
}
/* ============================================================
 * Event reads
 * ========================================================== */
const EVENT_FIELDS = [
  "id",
  "name",
  "start",
  "stop",
  "description",
  "phone_number",
  "appointment_booker_id",
  "appointment_resource_ids",
  "booking_line_ids",
  RESERVATION_META_FIELD,
];
function eventFields(): string[] {
  return hasCapacityField ? [...EVENT_FIELDS, CAPACITY_FIELD] : EVENT_FIELDS;
}
function snapshotEvent(event: CalendarEventRecord): OriginalEventState {
  const capacity = event[CAPACITY_FIELD];
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    appointmentBookerId: event.appointment_booker_id
      ? event.appointment_booker_id[0]
      : false,
    phoneNumber: event.phone_number ?? false,
    capacityReserved: typeof capacity === "number" ? capacity : undefined,
  };
}
function guestLabel(partySize: number): string {
  return `${partySize} ${partySize === 1 ? "guest" : "guests"}`;
}
/**
 * Best-effort: shows the real guest count in the "people" field.
 * A failure here never fails the booking.
 */
async function writeGuestCount(
  eventIds: number[],
  capacities: number[],
  partySize: number,
): Promise<void> {
  if (!hasCapacityField) {
    return;
  }
  let remaining = partySize;
  for (let i = 0; i < eventIds.length; i++) {
    const isLast = i === eventIds.length - 1;
    const share = isLast
      ? remaining
      : Math.min(capacities[i] ?? remaining, remaining);
    remaining -= share;
    try {
      await odooCall<boolean>("calendar.event", "write", [
        [eventIds[i]],
        { [CAPACITY_FIELD]: share },
      ]);
    } catch (error) {
      console.error("Could not write guest count to Odoo event:", error);
      return;
    }
  }
}
async function readEvents(ids: number[]): Promise<CalendarEventRecord[]> {
  if (ids.length === 0) {
    return [];
  }
  return odooCall<CalendarEventRecord[]>("calendar.event", "read", [
    ids,
    eventFields(),
  ]);
}
/* ============================================================
 * Legacy metadata migration
 * ========================================================== */
async function migrateLegacyEvent(
  event: CalendarEventRecord,
): Promise<ReservationMetadata | null> {
  const current = event[RESERVATION_META_FIELD];
  if (typeof current === "string" && current.trim()) {
    return decodeMetadata(current);
  }
  const legacy = extractLegacyMetadata(event.description);
  if (!legacy) {
    return null;
  }
  await odooCall<boolean>("calendar.event", "write", [
    [event.id],
    {
      [RESERVATION_META_FIELD]: encodeMetadata(legacy),
      description: false,
    },
  ]);
  return legacy;
}
/**
 * Run this once after deploying the new code.
 *
 * It moves old:
 *
 * KK_RESERVATION_META:...
 *
 * out of Description and into:
 *
 * x_studio_reservation_metadata_1
 */
export async function migrateLegacyReservationMetadata(): Promise<{
  success: boolean;
  migrated: number;
}> {
  await validateOdooFields();
  const events = await odooCall<CalendarEventRecord[]>(
    "calendar.event",
    "search_read",
    [[["description", "ilike", LEGACY_META_PREFIX]]],
    {
      fields: eventFields(),
      order: "start asc",
    },
  );
  let migrated = 0;
  for (const event of events) {
    const result = await migrateLegacyEvent(event);
    if (result) {
      migrated++;
    }
  }
  return {
    success: true,
    migrated,
  };
}
/* ============================================================
 * Color existing placeholders (no-op)
 * ========================================================== */
/**
 * calendar.event has no `color` field in this Odoo database, so
 * there is nothing to colorize. Kept so existing imports don't break.
 */
export async function colorizeExistingPlaceholders(): Promise<{
  success: boolean;
  updated: number;
}> {
  return { success: true, updated: 0 };
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
    if (!name) {
      return {
        success: false,
        error: "Customer name is required.",
      };
    }
    if (phone.replace(/\D/g, "").length < 9) {
      return {
        success: false,
        error: "A valid phone number is required.",
      };
    }
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
      return {
        success: false,
        error: "Automated reservations support 1–4 guests.",
      };
    }
    /**
     * Re-read Odoo and choose the best allocation immediately
     * before confirmation.
     */
    const allocation = await findAllocation(input.date, input.time, partySize);
    if (!allocation) {
      return {
        success: false,
        reason: "unavailable",
        error: "That reservation time is no longer available.",
      };
    }
    const eventIds = [...allocation.eventIds];
    const events = await readEvents(eventIds);
    if (events.length !== eventIds.length) {
      return {
        success: false,
        reason: "unavailable",
        error: "One or more reservation slots no longer exist.",
      };
    }
    /**
     * Final safety check.
     */
    for (const event of events) {
      const metadata = getMetadataFromEvent(event);
      if (metadata?.status === "confirmed") {
        return {
          success: false,
          reason: "unavailable",
          error: "That reservation time was just taken.",
        };
      }
      if (
        !event.name
          .toLowerCase()
          .includes(PUBLIC_PLACEHOLDER_NAME.toLowerCase())
      ) {
        return {
          success: false,
          reason: "unavailable",
          error: "That reservation slot is no longer available.",
        };
      }
    }
    /**
     * This is what fixes "Administrator".
     *
     * We find/create an actual Odoo contact for the customer.
     */
    const partnerId = await getOrCreateCustomerPartner({
      name,
      phone,
    });
    const code = makeReservationCode();
    const now = new Date().toISOString();
    const metadata: ReservationMetadata = {
      version: 2,
      code,
      name,
      phone,
      partySize,
      date: input.date,
      time: input.time,
      status: "confirmed",
      partnerId,
      eventIds,
      resourceIds: allocation.resources.map((resource) => resource.id),
      allocationType: allocation.type,
      originalEvents: events.map(snapshotEvent),
      createdAt: now,
      updatedAt: now,
    };
    const displayName = `${RESERVATION_NAME_PREFIX}${name} (${guestLabel(partySize)}) [${code}]`;
    /**
     * Three important changes happen here:
     *
     * 1. Customer becomes appointment booker
     * 2. Description is cleared
     * 3. Event name becomes the booked reservation name
     *
     * Metadata is stored only in the Studio field.
     */
    await odooCall<boolean>("calendar.event", "write", [
      eventIds,
      {
        name: displayName,
        appointment_booker_id: partnerId,
        phone_number: phone,
        description: false,
        [RESERVATION_META_FIELD]: encodeMetadata(metadata),
      },
    ]);
    await writeGuestCount(
      eventIds,
      allocation.resources.map((resource) => resource.capacity),
      partySize,
    );
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
      error:
        error instanceof Error ? error.message : "Unknown reservation error.",
    };
  }
}
/* ============================================================
 * Find reservation by code
 * ========================================================== */
async function findReservationEventsByCode(
  code: string,
): Promise<CalendarEventRecord[]> {
  await validateOdooFields();
  const normalized = code.trim().toUpperCase();
  return odooCall<CalendarEventRecord[]>(
    "calendar.event",
    "search_read",
    [[["name", "ilike", `[${normalized}]`]]],
    {
      fields: eventFields(),
      order: "start asc",
    },
  );
}
async function hydrateMetadata(
  event: CalendarEventRecord,
): Promise<ReservationMetadata | null> {
  const current = event[RESERVATION_META_FIELD];
  if (typeof current === "string" && current.trim()) {
    return decodeMetadata(current);
  }
  /**
   * Backwards compatibility:
   * old reservations are automatically migrated when accessed.
   */
  return migrateLegacyEvent(event);
}
/* ============================================================
 * Lookup by reservation code
 * ========================================================== */
export async function getOdooReservationByCode(
  code: string,
): Promise<ReservationLookupResult> {
  try {
    const events = await findReservationEventsByCode(code);
    if (events.length === 0) {
      return {
        success: false,
        error: "Reservation not found.",
      };
    }
    const metadata = await hydrateMetadata(events[0]);
    if (!metadata) {
      return {
        success: false,
        error: "Reservation metadata could not be read.",
      };
    }
    return {
      success: true,
      reservation_id: String(events[0].id),
      reservationId: String(events[0].id),
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
    };
  } catch (error) {
    console.error("getOdooReservationByCode failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown lookup error.",
    };
  }
}
/* ============================================================
 * Lookup by phone
 * ========================================================== */
export async function getOdooReservationByPhone(
  phone: string,
): Promise<ReservationLookupResult> {
  try {
    await validateOdooFields();
    const normalized = normalizePhone(phone);
    const events = await odooCall<CalendarEventRecord[]>(
      "calendar.event",
      "search_read",
      [[["name", "ilike", RESERVATION_NAME_PREFIX]]],
      {
        fields: eventFields(),
        order: "start desc",
        limit: 500,
      },
    );
    const matches: Array<{
      event: CalendarEventRecord;
      metadata: ReservationMetadata;
    }> = [];
    const seen = new Set<string>();
    for (const event of events) {
      const metadata = await hydrateMetadata(event);
      if (!metadata) {
        continue;
      }
      if (normalizePhone(metadata.phone) !== normalized) {
        continue;
      }
      if (seen.has(metadata.code)) {
        continue;
      }
      seen.add(metadata.code);
      matches.push({
        event,
        metadata,
      });
    }
    if (matches.length === 0) {
      return {
        success: false,
        error: "No reservation was found for that phone number.",
      };
    }
    const confirmed = matches.filter(
      (match) => match.metadata.status === "confirmed",
    );
    const selected = confirmed[0] ?? matches[0];
    return {
      success: true,
      reservation_id: String(selected.event.id),
      reservationId: String(selected.event.id),
      reservation_code: selected.metadata.code,
      reservationCode: selected.metadata.code,
      name: selected.metadata.name,
      phone: selected.metadata.phone,
      party_size: selected.metadata.partySize,
      partySize: selected.metadata.partySize,
      reservation_date: selected.metadata.date,
      date: selected.metadata.date,
      reservation_time: selected.metadata.time,
      time: selected.metadata.time,
      status: selected.metadata.status,
      event_ids: selected.metadata.eventIds,
      multiple: matches.length > 1,
    };
  } catch (error) {
    console.error("getOdooReservationByPhone failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown phone lookup error.",
    };
  }
}
/* ============================================================
 * Restore placeholder
 * ========================================================== */
async function restorePlaceholderEvents(
  metadata: ReservationMetadata,
  keepEventIds: number[] = [],
): Promise<void> {
  for (const original of metadata.originalEvents) {
    if (keepEventIds.includes(original.id)) {
      continue;
    }
    await odooCall<boolean>("calendar.event", "write", [
      [original.id],
      {
        name: original.name,
        /**
         * Restore whatever placeholder description originally
         * existed, e.g. the seeder marker.
         */
        description: original.description,
        /**
         * Customer is no longer the appointment booker.
         */
        appointment_booker_id: original.appointmentBookerId || false,
        phone_number: original.phoneNumber || false,
        /**
         * Remove internal reservation data.
         */
        [RESERVATION_META_FIELD]: false,
      },
    ]);
    if (typeof original.capacityReserved === "number") {
      try {
        await odooCall<boolean>("calendar.event", "write", [
          [original.id],
          { [CAPACITY_FIELD]: original.capacityReserved },
        ]);
      } catch (error) {
        console.error("Could not restore placeholder guest count:", error);
      }
    }
  }
}
/* ============================================================
 * Cancel reservation
 * ========================================================== */
export async function cancelOdooReservationByCode(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const events = await findReservationEventsByCode(code);
    if (events.length === 0) {
      return {
        success: false,
        error: "Reservation not found.",
      };
    }
    const metadata = await hydrateMetadata(events[0]);
    if (!metadata) {
      return {
        success: false,
        error: "Reservation metadata could not be read.",
      };
    }
    await restorePlaceholderEvents(metadata);
    return {
      success: true,
    };
  } catch (error) {
    console.error("cancelOdooReservationByCode failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown cancellation error.",
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
): Promise<{
  success: boolean;
  error?: string;
  reason?: string;
}> {
  try {
    await validateOdooFields();
    const oldEvents = await findReservationEventsByCode(code);
    if (oldEvents.length === 0) {
      return {
        success: false,
        error: "Reservation not found.",
      };
    }
    const oldMetadata = await hydrateMetadata(oldEvents[0]);
    if (!oldMetadata) {
      return {
        success: false,
        error: "Reservation metadata could not be read.",
      };
    }
    const allocation = await findAllocation(
      newDate,
      newTime,
      oldMetadata.partySize,
    );
    if (!allocation) {
      return {
        success: false,
        reason: "unavailable",
        error: "The requested new time is no longer available.",
      };
    }
    const newEventIds = [...allocation.eventIds];
    /**
     * Moving to the exact same allocation is effectively a
     * successful no-op.
     */
    const oldSorted = [...oldMetadata.eventIds].sort((a, b) => a - b);
    const newSorted = [...newEventIds].sort((a, b) => a - b);
    if (
      oldSorted.length === newSorted.length &&
      oldSorted.every((value, index) => value === newSorted[index])
    ) {
      return {
        success: true,
      };
    }
    const newEvents = await readEvents(newEventIds);
    if (newEvents.length !== newEventIds.length) {
      return {
        success: false,
        reason: "unavailable",
        error: "The new reservation slot could not be loaded.",
      };
    }
    for (const event of newEvents) {
      if (
        !event.name
          .toLowerCase()
          .includes(PUBLIC_PLACEHOLDER_NAME.toLowerCase())
      ) {
        return {
          success: false,
          reason: "unavailable",
          error: "The new reservation time was just taken.",
        };
      }
    }
    const partnerId = await getOrCreateCustomerPartner({
      name: oldMetadata.name,
      phone: oldMetadata.phone,
    });
    const newMetadata: ReservationMetadata = {
      version: 2,
      code: oldMetadata.code,
      name: oldMetadata.name,
      phone: oldMetadata.phone,
      partySize: oldMetadata.partySize,
      date: newDate,
      time: newTime,
      status: "confirmed",
      partnerId,
      eventIds: newEventIds,
      resourceIds: allocation.resources.map((resource) => resource.id),
      allocationType: allocation.type,
      originalEvents: newEvents.map(snapshotEvent),
      createdAt: oldMetadata.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const displayName = `${RESERVATION_NAME_PREFIX}${oldMetadata.name} (${guestLabel(oldMetadata.partySize)}) [${oldMetadata.code}]`;
    /**
     * Claim new allocation first.
     */
    await odooCall<boolean>("calendar.event", "write", [
      newEventIds,
      {
        name: displayName,
        appointment_booker_id: partnerId,
        phone_number: oldMetadata.phone,
        description: false,
        [RESERVATION_META_FIELD]: encodeMetadata(newMetadata),
      },
    ]);
    await writeGuestCount(
      newEventIds,
      allocation.resources.map((resource) => resource.capacity),
      oldMetadata.partySize,
    );
    try {
      /**
       * Only after new allocation succeeds do we release the old
       * allocation.
       */
      await restorePlaceholderEvents(oldMetadata, newEventIds);
    } catch (restoreError) {
      console.error(
        "Failed restoring previous reservation slots:",
        restoreError,
      );
      /**
       * Best-effort rollback of the newly claimed allocation.
       */
      try {
        await restorePlaceholderEvents(newMetadata);
      } catch (rollbackError) {
        console.error(
          "Reservation modification rollback failed:",
          rollbackError,
        );
      }
      return {
        success: false,
        error: "The reservation could not be moved safely.",
      };
    }
    return {
      success: true,
    };
  } catch (error) {
    console.error("modifyOdooReservation failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown modification error.",
    };
  }
}
/* ============================================================
 * Compatibility exports
 * ========================================================== */
export const createReservation = createOdooReservation;
export const getReservationByCode = getOdooReservationByCode;
export const getReservationByPhone = getOdooReservationByPhone;
export const cancelReservationByCode = cancelOdooReservationByCode;
export const modifyReservation = modifyOdooReservation;
/* ============================================================
 * Debug
 * ========================================================== */
export async function debugReservationByCode(code: string) {
  const events = await findReservationEventsByCode(code);
  return Promise.all(
    events.map(async (event) => ({
      id: event.id,
      name: event.name,
      appointmentBooker: event.appointment_booker_id,
      phone: event.phone_number,
      description: event.description,
      metadataField: event[RESERVATION_META_FIELD],
      metadata: await hydrateMetadata(event),
    })),
  );
}
export const cancelOdooReservation = cancelOdooReservationByCode;