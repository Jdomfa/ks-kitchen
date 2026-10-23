import {
  getPlaceholderInventoryForDate,
  type PlaceholderOption,
} from "@/lib/odoo/placeholder";

export type AllocationResource = {
  id: number;
  name: string;
  capacity: number;
};

export type ReservationAllocation =
  | {
      type: "single";
      time: string;
      start: string;
      stop: string;
      capacity: number;
      eventIds: [number];
      resources: [AllocationResource];
    }
  | {
      type: "merged";
      time: string;
      start: string;
      stop: string;
      capacity: number;
      eventIds: [number, number];
      resources: [AllocationResource, AllocationResource];
    };

function toResource(option: PlaceholderOption): AllocationResource {
  return {
    id: option.resourceId,
    name: option.resourceName,
    capacity: option.capacity,
  };
}

function areLinked(
  left: PlaceholderOption,
  right: PlaceholderOption,
): boolean {
  return (
    left.linkedResourceIds.includes(right.resourceId) ||
    right.linkedResourceIds.includes(left.resourceId)
  );
}

function findSingleAllocations(
  placeholders: PlaceholderOption[],
  partySize: number,
): ReservationAllocation[] {
  return placeholders
    .filter((option) => option.capacity >= partySize)
    .sort((a, b) => {
      if (a.capacity !== b.capacity) {
        return a.capacity - b.capacity;
      }

      return a.resourceId - b.resourceId;
    })
    .map(
      (option): ReservationAllocation => ({
        type: "single",
        time: option.time,
        start: option.start,
        stop: option.stop,
        capacity: option.capacity,
        eventIds: [option.eventId],
        resources: [toResource(option)],
      }),
    );
}

function findMergedAllocations(
  placeholders: PlaceholderOption[],
  partySize: number,
): ReservationAllocation[] {
  if (partySize < 3 || partySize > 4) {
    return [];
  }

  const twoSeatTables = placeholders
    .filter((option) => option.capacity === 2)
    .sort((a, b) => a.resourceId - b.resourceId);
  const allocations: ReservationAllocation[] = [];

  for (let i = 0; i < twoSeatTables.length; i++) {
    for (let j = i + 1; j < twoSeatTables.length; j++) {
      const left = twoSeatTables[i];
      const right = twoSeatTables[j];

      if (!areLinked(left, right)) {
        continue;
      }

      const capacity = left.capacity + right.capacity;

      if (capacity < partySize) {
        continue;
      }

      allocations.push({
        type: "merged",
        time: left.time,
        start: left.start,
        stop: left.stop,
        capacity,
        eventIds: [left.eventId, right.eventId],
        resources: [toResource(left), toResource(right)],
      });
    }
  }

  return allocations;
}

function compareAllocations(
  left: ReservationAllocation,
  right: ReservationAllocation,
): number {
  const timeComparison = left.start.localeCompare(right.start);

  if (timeComparison !== 0) {
    return timeComparison;
  }

  if (left.resources.length !== right.resources.length) {
    return left.resources.length - right.resources.length;
  }

  if (left.capacity !== right.capacity) {
    return left.capacity - right.capacity;
  }

  return left.resources[0].id - right.resources[0].id;
}

export async function getReservationAllocations(
  date: string,
  partySize: number,
): Promise<ReservationAllocation[]> {
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
    return [];
  }

  const inventory = await getPlaceholderInventoryForDate(date);
  const byPeriod = new Map<string, PlaceholderOption[]>();

  for (const placeholder of inventory) {
    const key = `${placeholder.start}::${placeholder.stop}`;
    const group = byPeriod.get(key) ?? [];

    group.push(placeholder);
    byPeriod.set(key, group);
  }

  const allocations: ReservationAllocation[] = [];

  for (const group of byPeriod.values()) {
    const singles = findSingleAllocations(group, partySize);

    if (singles.length > 0) {
      allocations.push(...singles);
      continue;
    }

    allocations.push(...findMergedAllocations(group, partySize));
  }

  return allocations.sort(compareAllocations);
}

export async function getBookableReservationTimes(
  date: string,
  partySize: number,
): Promise<string[]> {
  const allocations = await getReservationAllocations(date, partySize);

  return Array.from(new Set(allocations.map((allocation) => allocation.time)));
}

export async function findBestAllocation(
  date: string,
  time: string,
  partySize: number,
): Promise<ReservationAllocation | null> {
  const allocations = await getReservationAllocations(date, partySize);

  return allocations.find((allocation) => allocation.time === time) ?? null;
}
