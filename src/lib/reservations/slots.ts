import {
  createServiceClient,
} from "@/lib/supabase/service";

import {
  updateReservationInOdoo,
} from "@/lib/odoo/client";

import {
  getReservationAllocations,
  findBestAllocation,
  type ReservationAllocation,
} from "@/lib/odoo/reservation-allocation";

import {
  claimPlaceholder,
} from "@/lib/odoo/placeholder";

/* ============================================================
 * Types
 * ========================================================== */

export type SlotAvailability = {
  slot_time:
    string;

  available_covers:
    number;

  booked_covers:
    number;

  allocation_count?:
    number;
};

/* ============================================================
 * Availability
 * ========================================================== */

/**
 * Kept for compatibility with any older caller.
 *
 * New reservation flows should use:
 *
 * getSlotAvailabilityForParty()
 */
export async function getSlotAvailability(
  date: string
): Promise<
  SlotAvailability[]
> {
  return getSlotAvailabilityForParty(
    date,
    1
  );
}

export async function getSlotAvailabilityForParty(
  date: string,
  partySize: number
): Promise<
  SlotAvailability[]
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

  const allocations =
    await getReservationAllocations(
      date,
      partySize
    );

  /**
   * There may be multiple allocations at the same time.
   *
   * Example:
   *
   * 18:00
   *
   * Table 5
   * Table 6
   *
   * Customer still sees 18:00 once.
   */
  const grouped =
    new Map<
      string,
      ReservationAllocation[]
    >();

  for (
    const allocation of
      allocations
  ) {
    const existing =
      grouped.get(
        allocation.time
      ) ?? [];

    existing.push(
      allocation
    );

    grouped.set(
      allocation.time,
      existing
    );
  }

  return Array.from(
    grouped.entries()
  )
    .map(
      ([
        time,
        options,
      ]) => ({
        slot_time:
          `${time}:00`,

        /**
         * Kept only because your existing SlotAvailability type
         * expects this property.
         */
        available_covers:
          Math.max(
            ...options.map(
              (
                option
              ) =>
                option.capacity
            )
          ),

        booked_covers:
          0,

        allocation_count:
          options.length,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        a.slot_time.localeCompare(
          b.slot_time
        )
    );
}

/* ============================================================
 * Reservation creation
 * ========================================================== */

export async function createSlotReservation(
  args: {
    name: string;

    phone?: string;

    party_size:
      number;

    date:
      string;

    time:
      string;
  }
) {
  if (
    !Number.isInteger(
      args.party_size
    ) ||
    args.party_size <
      1 ||
    args.party_size >
      4
  ) {
    return {
      success:
        false,

      reason:
        "party_size_requires_agent",

      error:
        "Parties of 5 or more require assistance from our team.",
    };
  }

  /**
   * Fresh Odoo allocation.
   *
   * The time may have been shown to the customer several messages
   * ago, so never trust the earlier lookup.
   */
  const allocation =
    await findBestAllocation(
      args.date,
      args.time,
      args.party_size
    );

  if (
    !allocation
  ) {
    return {
      success:
        false,

      reason:
        "slot_unavailable",

      error:
        "That reservation time is no longer available.",
    };
  }

  const supabase =
    createServiceClient();

  /**
   * Keep your existing application reservation RPC.
   *
   * This still generates the reservation ID/code and maintains the
   * rest of your current reservation system.
   */
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "create_slot_reservation_atomic",

      {
        p_name:
          args.name,

        p_phone:
          args.phone ??
          null,

        p_party_size:
          args.party_size,

        p_reservation_date:
          args.date,

        p_reservation_time:
          args.time,
      }
    );

  if (
    error
  ) {
    throw new Error(
      error.message
    );
  }

  const result =
    data as {
      success:
        boolean;

      reservation_id?:
        string;

      reservation_code?:
        string;

      error?:
        string;

      reason?:
        string;
    };

  if (
    !result.success
  ) {
    return result;
  }

  /**
   * Important:
   *
   * DO NOT call pushReservationToOdoo() anymore.
   *
   * There is already an Odoo placeholder event.
   *
   * We convert that existing event into the reservation instead
   * of creating another event.
   */
  const claimResult =
    await claimAllocation(
      allocation,

      {
        name:
          args.name,

        phone:
          args.phone,

        reservationCode:
          result
            .reservation_code,
      }
    );

  if (
    !claimResult.success
  ) {
    console.error(
      "Reservation exists in Supabase but Odoo allocation failed",
      {
        reservationId:
          result
            .reservation_id,

        reservationCode:
          result
            .reservation_code,

        allocation,

        error:
          claimResult.error,
      }
    );

    return {
      ...result,

      success:
        false,

      reason:
        "odoo_allocation_failed",

      error:
        claimResult.error ??
        "Unable to secure the Odoo table allocation.",
    };
  }

  /**
   * Store Odoo event IDs.
   */
  if (
    result.reservation_id
  ) {
    const {
      error:
        linkError,
    } =
      await supabase
        .from(
          "reservations"
        )
        .update({
          odoo_event_id:
            allocation
              .eventIds[0],

          odoo_event_ids:
            allocation
              .eventIds,
        })
        .eq(
          "id",
          result
            .reservation_id
        );

    if (
      linkError
    ) {
      console.error(
        "Failed to store Odoo event IDs:",
        linkError
      );
    }
  }

  return {
    ...result,

    allocation: {
      type:
        allocation.type,

      eventIds:
        allocation.eventIds,

      resources:
        allocation.resources,
    },
  };
}

/* ============================================================
 * Claim allocation
 * ========================================================== */

async function claimAllocation(
  allocation:
    ReservationAllocation,

  details: {
    name:
      string;

    phone?:
      string;

    reservationCode?:
      string;
  }
): Promise<{
  success:
    boolean;

  error?:
    string;
}> {
  if (
    allocation.type ===
    "single"
  ) {
    return claimPlaceholder(
      allocation.eventIds[0],

      details
    );
  }

  /**
   * Merged:
   *
   * claim both actual Odoo placeholder events.
   */
  const [
    firstEventId,
    secondEventId,
  ] =
    allocation.eventIds;

  const first =
    await claimPlaceholder(
      firstEventId,
      details
    );

  if (
    !first.success
  ) {
    return first;
  }

  const second =
    await claimPlaceholder(
      secondEventId,
      details
    );

  if (
    !second.success
  ) {
    /**
     * This is the remaining concurrency weakness.
     *
     * The first Odoo write succeeded while the second failed.
     *
     * We should eventually replace this with an Odoo-side
     * transactional method.
     */
    return {
      success:
        false,

      error:
        "The first table of the merged allocation was reserved, " +
        `but the second failed: ${second.error ?? "unknown error"}`,
    };
  }

  return {
    success:
      true,
  };
}

/* ============================================================
 * Modify existing reservation
 * ========================================================== */

export async function modifySlotReservation(
  code: string,
  date: string,
  time: string
) {
  const supabase =
    createServiceClient();

  const {
    data:
      existing,

    error:
      existingError,
  } =
    await supabase
      .from(
        "reservations"
      )
      .select(
        "id, party_size, odoo_event_id, odoo_event_ids"
      )
      .eq(
        "reservation_code",

        code
          .trim()
          .toUpperCase()
      )
      .maybeSingle();

  if (
    existingError
  ) {
    throw new Error(
      existingError.message
    );
  }

  if (
    !existing
  ) {
    return {
      success:
        false,

      reason:
        "reservation_not_found",

      error:
        "Reservation not found.",
    };
  }

  const partySize =
    Number(
      existing
        .party_size
    );

  /**
   * For now keep 5+ out of automatic modification too.
   */
  if (
    !Number.isInteger(
      partySize
    ) ||
    partySize < 1 ||
    partySize > 4
  ) {
    return {
      success:
        false,

      reason:
        "party_size_requires_agent",

      error:
        "This reservation requires assistance from our team.",
    };
  }

  const oldEventIds:
    number[] =
    Array.isArray(
      existing
        .odoo_event_ids
    )
      ? existing
          .odoo_event_ids
      : existing
          .odoo_event_id
        ? [
            existing
              .odoo_event_id,
          ]
        : [];

  /**
   * Don't automate merged rescheduling yet.
   *
   * To do it correctly we need:
   *
   * release two old placeholders
   * +
   * claim one/two new placeholders
   *
   * as one safe operation.
   */
  if (
    oldEventIds.length >
    1
  ) {
    return {
      success:
        false,

      reason:
        "merged_reschedule_requires_agent",

      error:
        "Merged-table reservations need assistance from our team to reschedule.",
    };
  }

  /**
   * Validate the new time against current Odoo inventory.
   */
  const allocation =
    await findBestAllocation(
      date,
      time,
      partySize
    );

  if (
    !allocation
  ) {
    return {
      success:
        false,

      reason:
        "slot_unavailable",

      error:
        "That reservation time is no longer available.",
    };
  }

  /**
   * If changing a single reservation would require merging two
   * tables, let staff handle it for now.
   *
   * Otherwise we'd need to convert the old Odoo event into TWO
   * new events safely.
   */
  if (
    allocation.type ===
    "merged"
  ) {
    return {
      success:
        false,

      reason:
        "merged_reschedule_requires_agent",

      error:
        "This change requires a merged-table setup, so our team needs to assist.",
    };
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "modify_slot_reservation_atomic",

      {
        p_code:
          code,

        p_new_date:
          date,

        p_new_time:
          time,
      }
    );

  if (
    error
  ) {
    throw new Error(
      error.message
    );
  }

  const result =
    data as {
      success:
        boolean;

      error?:
        string;

      reason?:
        string;

      available_covers?:
        number;
    };

  if (
    !result.success
  ) {
    return result;
  }

  /**
   * Preserve your existing single-event update behavior.
   */
  if (
    existing
      .odoo_event_id
  ) {
    updateReservationInOdoo(
      existing
        .odoo_event_id,

      {
        date,
        time,
      }
    ).catch(
      (
        err
      ) => {
        console.error(
          "Failed to update Odoo reservation:",
          err
        );
      }
    );
  }

  return result;
}