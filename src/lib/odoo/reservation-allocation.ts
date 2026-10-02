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

      resources: [
        AllocationResource
      ];
    }
  | {
      type: "merged";

      time: string;

      start: string;
      stop: string;

      capacity: number;

      eventIds: [
        number,
        number
      ];

      resources: [
        AllocationResource,
        AllocationResource
      ];
    };

/* ============================================================
 * Helpers
 * ========================================================== */

function toResource(
  option: PlaceholderOption
): AllocationResource {
  return {
    id: option.resourceId,

    name:
      option.resourceName,

    capacity:
      option.capacity,
  };
}

function areLinked(
  left: PlaceholderOption,
  right: PlaceholderOption
): boolean {
  /**
   * Treat either direction as sufficient.
   *
   * This means:
   *
   * Table 1 -> linked to Table 2
   *
   * is enough even if someone did not also configure:
   *
   * Table 2 -> linked to Table 1
   */
  return (
    left.linkedResourceIds.includes(
      right.resourceId
    ) ||
    right.linkedResourceIds.includes(
      left.resourceId
    )
  );
}

/* ============================================================
 * Single table
 * ========================================================== */

function findSingleAllocations(
  placeholders: PlaceholderOption[],
  partySize: number
): ReservationAllocation[] {
  return placeholders
    .filter(
      (option) =>
        option.capacity >=
        partySize
    )
    .sort((a, b) => {
      /**
       * Prefer smallest suitable table.
       *
       * Party 1:
       * capacity 2 beats capacity 4.
       *
       * Party 2:
       * capacity 2 beats capacity 4.
       */
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
    })
    .map(
      (
        option
      ): ReservationAllocation => ({
        type:
          "single",

        time:
          option.time,

        start:
          option.start,

        stop:
          option.stop,

        capacity:
          option.capacity,

        eventIds: [
          option.eventId,
        ],

        resources: [
          toResource(
            option
          ),
        ],
      })
    );
}

/* ============================================================
 * Merge
 * ========================================================== */

function findMergedAllocations(
  placeholders: PlaceholderOption[],
  partySize: number
): ReservationAllocation[] {
  /**
   * We only merge for parties of 3 or 4.
   */
  if (
    partySize < 3 ||
    partySize > 4
  ) {
    return [];
  }

  /**
   * Keep merge rules intentionally simple:
   *
   * 2-seat + 2-seat only.
   */
  const twoSeatTables =
    placeholders
      .filter(
        (option) =>
          option.capacity === 2
      )
      .sort(
        (a, b) =>
          a.resourceId -
          b.resourceId
      );

  const allocations:
    ReservationAllocation[] =
    [];

  const seen =
    new Set<string>();

  for (
    let i = 0;
    i <
    twoSeatTables.length;
    i++
  ) {
    for (
      let j = i + 1;
      j <
      twoSeatTables.length;
      j++
    ) {
      const left =
        twoSeatTables[i];

      const right =
        twoSeatTables[j];

      /**
       * Must be linked in Odoo.
       */
      if (
        !areLinked(
          left,
          right
        )
      ) {
        continue;
      }

      const combinedCapacity =
        left.capacity +
        right.capacity;

      if (
        combinedCapacity <
        partySize
      ) {
        continue;
      }

      /**
       * Prevent duplicate:
       *
       * Table 1 + Table 2
       *
       * and
       *
       * Table 2 + Table 1
       */
      const key = [
        left.resourceId,
        right.resourceId,
      ]
        .sort(
          (a, b) =>
            a - b
        )
        .join(":");

      if (
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);

      allocations.push({
        type:
          "merged",

        time:
          left.time,

        start:
          left.start,

        stop:
          left.stop,

        capacity:
          combinedCapacity,

        eventIds: [
          left.eventId,
          right.eventId,
        ],

        resources: [
          toResource(
            left
          ),

          toResource(
            right
          ),
        ],
      });
    }
  }

  return allocations;
}

/* ============================================================
 * Sorting
 * ========================================================== */

function compareAllocations(
  left: ReservationAllocation,
  right: ReservationAllocation
): number {
  const timeComparison =
    left.start.localeCompare(
      right.start
    );

  if (
    timeComparison !== 0
  ) {
    return timeComparison;
  }

  /**
   * Single table always beats merged table.
   */
  if (
    left.resources.length !==
    right.resources.length
  ) {
    return (
      left.resources.length -
      right.resources.length
    );
  }

  /**
   * Then prefer smaller capacity.
   */
  if (
    left.capacity !==
    right.capacity
  ) {
    return (
      left.capacity -
      right.capacity
    );
  }

  /**
   * Stable fallback.
   */
  return (
    left.resources[0].id -
    right.resources[0].id
  );
}

/* ============================================================
 * Main allocator
 * ========================================================== */

export async function getReservationAllocations(
  date: string,
  partySize: number
): Promise<
  ReservationAllocation[]
> {
  if (
    !Number.isInteger(
      partySize
    ) ||
    partySize < 1 ||
    partySize > 4
  ) {
    return [];
  }

  /**
   * IMPORTANT:
   *
   * Pull ALL placeholder inventory first.
   *
   * Do NOT filter out 2-seat tables based on partySize here.
   *
   * A party of 4 may need:
   *
   * Table 1 capacity 2
   * +
   * Table 2 capacity 2
   */
  const inventory =
    await getPlaceholderInventoryForDate(
      date
    );

  /**
   * Group by exact start + stop.
   *
   * Two tables can only be merged if their placeholder windows
   * are identical.
   */
  const byPeriod =
    new Map<
      string,
      PlaceholderOption[]
    >();

  for (
    const placeholder of inventory
  ) {
    const key =
      `${placeholder.start}::${placeholder.stop}`;

    const group =
      byPeriod.get(key) ??
      [];

    group.push(
      placeholder
    );

    byPeriod.set(
      key,
      group
    );
  }

  const allocations:
    ReservationAllocation[] =
    [];

  for (
    const group of
      byPeriod.values()
  ) {
    const singles =
      findSingleAllocations(
        group,
        partySize
      );

    /**
     * This is deliberate.
     *
     * If a suitable single table exists at this time,
     * don't waste two tables by returning merged alternatives.
     */
    if (
      singles.length > 0
    ) {
      allocations.push(
        ...singles
      );

      continue;
    }

    /**
     * Only try merging if no suitable single table exists.
     */
    allocations.push(
      ...findMergedAllocations(
        group,
        partySize
      )
    );
  }

  return allocations.sort(
    compareAllocations
  );
}

/* ============================================================
 * Customer-facing times
 * ========================================================== */

export async function getBookableReservationTimes(
  date: string,
  partySize: number
): Promise<string[]> {
  const allocations =
    await getReservationAllocations(
      date,
      partySize
    );

  /**
   * Multiple table choices may exist for one time.
   *
   * Customer sees the time once.
   */
  return Array.from(
    new Set(
      allocations.map(
        (
          allocation
        ) =>
          allocation.time
      )
    )
  );
}

/* ============================================================
 * Final confirmation lookup
 * ========================================================== */

export async function findBestAllocation(
  date: string,
  time: string,
  partySize: number
): Promise<
  ReservationAllocation | null
> {
  /**
   * Fresh query.
   *
   * We deliberately do NOT remember the table picked when the
   * customer first saw the available time.
   */
  const allocations =
    await getReservationAllocations(
      date,
      partySize
    );

  return (
    allocations.find(
      (
        allocation
      ) =>
        allocation.time ===
        time
    ) ??
    null
  );
}