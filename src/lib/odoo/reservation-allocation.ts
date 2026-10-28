import { odooCall, odooUtcRange } from "@/lib/odoo/rpc";
import {
  RESERVATION_DURATION_HOURS,
  RESERVATION_TIMES,
  isValidReservationTime,
} from "@/lib/reservations/time-slots";

const APPOINTMENT_TYPE_ID = Number(process.env.ODOO_APPOINTMENT_TYPE_ID);

export type AllocationResource = {
  id: number;
  name: string;
  capacity: number;
};

export type ReservationAllocation = {
  type: "single" | "merged";
  time: string; // "HH:MM" Lagos
  start: string; // Odoo UTC
  stop: string; // Odoo UTC
  capacity: number;
  resources: AllocationResource[];
};

type ResourceRecord = {
  id: number;
  name: string;
  capacity: number | false;
  linked_resource_ids: number[];
};

type BusyEvent = {
  id: number;
  start: string;
  stop: string;
  resource_ids?: number[];
  appointment_resource_ids?: number[];
};

type DayState = {
  resources: ResourceRecord[];
  busy: BusyEvent[];
};

function assertConfigured() {
  if (!Number.isInteger(APPOINTMENT_TYPE_ID) || APPOINTMENT_TYPE_ID <= 0) {
    throw new Error("ODOO_APPOINTMENT_TYPE_ID is missing or invalid.");
  }
}

/**
 * Loads the tables and every live booking for the day in two calls, so all
 * slots can be evaluated in memory.
 *
 * Unclaimed "... Placeholder" events (public or family) are ignored: they are
 * leftover inventory, not bookings. Archived (cancelled) events are excluded
 * by Odoo's default active filter.
 */
async function loadDayState(
  date: string,
  excludeEventIds: number[],
): Promise<DayState> {
  assertConfigured();

  const dayStart = odooUtcRange(date, RESERVATION_TIMES[0], 0).start;
  const dayEnd = odooUtcRange(
    date,
    RESERVATION_TIMES[RESERVATION_TIMES.length - 1],
    RESERVATION_DURATION_HOURS,
  ).stop;

  const [resources, busy] = await Promise.all([
    odooCall<ResourceRecord[]>(
      "appointment.resource",
      "search_read",
      [[["appointment_type_ids", "in", [APPOINTMENT_TYPE_ID]]]],
      { fields: ["id", "name", "capacity", "linked_resource_ids"] },
    ),
    odooCall<BusyEvent[]>(
      "calendar.event",
      "search_read",
      [
        [
          ["start", "<", dayEnd],
          ["stop", ">", dayStart],
          ["name", "not ilike", "Placeholder"],
          ["id", "not in", excludeEventIds],
        ],
      ],
      {
        fields: ["id", "start", "stop", "resource_ids", "appointment_resource_ids"],
      },
    ),
  ]);

  return { resources, busy };
}

function allocateSlot(
  state: DayState,
  date: string,
  time: string,
  partySize: number,
): ReservationAllocation | null {
  if (!isValidReservationTime(time)) return null;

  const { start, stop } = odooUtcRange(date, time, RESERVATION_DURATION_HOURS);

  // No bookings in the past.
  if (new Date(`${start.replace(" ", "T")}Z`).getTime() <= Date.now()) {
    return null;
  }

  // Odoo UTC strings compare correctly as text.
  const blocked = new Set<number>();
  for (const event of state.busy) {
    if (event.start < stop && event.stop > start) {
      for (const id of event.resource_ids ?? []) blocked.add(id);
      for (const id of event.appointment_resource_ids ?? []) blocked.add(id);
    }
  }

  const free = state.resources
    .filter(
      (r) => !blocked.has(r.id) && typeof r.capacity === "number" && r.capacity > 0,
    )
    .sort(
      (a, b) => (a.capacity as number) - (b.capacity as number) || a.id - b.id,
    );

  const toResource = (r: ResourceRecord): AllocationResource => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity as number,
  });

  // 1. Smallest single table that fits.
  const single = free.find((r) => (r.capacity as number) >= partySize);
  if (single) {
    return {
      type: "single",
      time,
      start,
      stop,
      capacity: single.capacity as number,
      resources: [toResource(single)],
    };
  }

  // 2. Same rule as before: parties of 3-4 may use two linked 2-seat tables.
  if (partySize >= 3 && partySize <= 4) {
    const twoSeaters = free.filter((r) => r.capacity === 2);
    for (let i = 0; i < twoSeaters.length; i++) {
      for (let j = i + 1; j < twoSeaters.length; j++) {
        const left = twoSeaters[i];
        const right = twoSeaters[j];
        const linked =
          (left.linked_resource_ids ?? []).includes(right.id) ||
          (right.linked_resource_ids ?? []).includes(left.id);
        if (!linked) continue;

        return {
          type: "merged",
          time,
          start,
          stop,
          capacity: 4,
          resources: [toResource(left), toResource(right)],
        };
      }
    }
  }

  return null;
}

/** One best allocation per bookable hour. */
export async function getReservationAllocations(
  date: string,
  partySize: number,
  options: { excludeEventIds?: number[] } = {},
): Promise<ReservationAllocation[]> {
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
    return [];
  }
  const state = await loadDayState(date, options.excludeEventIds ?? []);

  console.log("[availability] input", { date, partySize, typeId: APPOINTMENT_TYPE_ID });
  console.log(
    "[availability] resources",
    state.resources.map((r) => ({ id: r.id, name: r.name, cap: r.capacity })),
  );
  console.log(
    "[availability] busy events",
    state.busy.map((e) => ({
      id: e.id,
      start: e.start,
      stop: e.stop,
      res: [...(e.resource_ids ?? []), ...(e.appointment_resource_ids ?? [])],
    })),
  );

  const result = RESERVATION_TIMES.map((time) =>
    allocateSlot(state, date, time, partySize),
  ).filter((a): a is ReservationAllocation => a !== null);

  console.log("[availability] bookable", result.map((a) => a.time));
  return result;
}

/** Times ("16:00") that still have a table. Used by the chat flow. */
export async function getBookableReservationTimes(
  date: string,
  partySize: number,
): Promise<string[]> {
  const allocations = await getReservationAllocations(date, partySize);
  return allocations.map((a) => a.time);
}

export async function findBestAllocation(
  date: string,
  time: string,
  partySize: number,
  options: { excludeEventIds?: number[] } = {},
): Promise<ReservationAllocation | null> {
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
    return null;
  }
  const state = await loadDayState(date, options.excludeEventIds ?? []);
  return allocateSlot(state, date, time, partySize);
}