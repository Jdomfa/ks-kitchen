import { randomBytes } from "crypto";

import {
  findBestAllocation,
  type ReservationAllocation,
} from "@/lib/odoo/reservation-allocation";

/* ============================================================
 * Environment
 * ========================================================== */

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

/* ============================================================
 * JSON RPC
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

async function getUid():
  Promise<number> {
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

  const response =
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

  if (
    !response.ok
  ) {
    throw new Error(
      `Odoo authentication HTTP error: ${response.status}`
    );
  }

  const data =
    (await response.json()) as JsonRpcResult<number>;

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

  const response =
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

  if (
    !response.ok
  ) {
    throw new Error(
      `Odoo HTTP error: ${response.status}`
    );
  }

  const data =
    (await response.json()) as JsonRpcResult<T>;

  if (
    data.error
  ) {
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

type Many2One =
  | [
      number,
      string
    ]
  | false;

type OdooReservationEvent = {
  id:
    number;

  name:
    string;

  start:
    string;

  stop:
    string;

  description:
    string | false;

  phone_number:
    string | false;

  partner_id:
    Many2One;

  appointment_booker_id:
    Many2One;

  resource_ids:
    number[];

  appointment_resource_ids:
    number[];
};

type OriginalEventState = {
  eventId:
    number;

  name:
    string;

  partnerId:
    number | false;

  appointmentBookerId:
    number | false;

  phoneNumber:
    string | false;

  description:
    string | false;
};

type ReservationMetadata = {
  version:
    1;

  reservationCode:
    string;

  customerName:
    string;

  phone:
    string;

  partySize:
    number;

  date:
    string;

  time:
    string;

  allocationType:
    "single" | "merged";

  eventIds:
    number[];

  resourceIds:
    number[];

  resourceNames:
    string[];

  createdAt:
    string;

  originalEvents:
    OriginalEventState[];
};

export type OdooReservationResult = {
  success:
    boolean;

  reservationCode?:
    string;

  eventIds?:
    number[];

  allocationType?:
    "single" | "merged";

  resources?: {
    id:
      number;

    name:
      string;

    capacity:
      number;
  }[];

  error?:
    string;

  reason?:
    string;
};

export type OdooReservationLookup = {
  success:
    boolean;

  reservationCode?:
    string;

  name?:
    string;

  phone?:
    string;

  partySize?:
    number;

  date?:
    string;

  time?:
    string;

  status?:
    "confirmed" | "cancelled";

  eventIds?:
    number[];

  resources?: string[];

  error?:
    string;
};

/* ============================================================
 * Metadata
 * ========================================================== */

/**
 * We need somewhere inside Odoo to keep information that is not
 * represented by a dedicated field yet:
 *
 * - reservation code
 * - party size
 * - merged event IDs
 * - original placeholder state
 *
 * calendar.event.description is used for this.
 *
 * Base64 keeps the machine metadata reasonably safe from Odoo's
 * HTML description handling.
 */
const META_PREFIX =
  "KK_RESERVATION_META:";

function encodeMetadata(
  metadata:
    ReservationMetadata
): string {
  const encoded =
    Buffer.from(
      JSON.stringify(
        metadata
      ),
      "utf8"
    ).toString(
      "base64url"
    );

  return (
    `${META_PREFIX}${encoded}`
  );
}

function decodeMetadata(
  description:
    string | false | undefined
):
  | ReservationMetadata
  | null {
  if (
    !description
  ) {
    return null;
  }

  const index =
    description.indexOf(
      META_PREFIX
    );

  if (
    index === -1
  ) {
    return null;
  }

  const afterPrefix =
    description.slice(
      index +
        META_PREFIX.length
    );

  /**
   * Base64url only consists of these characters.
   */
  const match =
    afterPrefix.match(
      /^[A-Za-z0-9_-]+/
    );

  if (
    !match
  ) {
    return null;
  }

  try {
    const json =
      Buffer.from(
        match[0],
        "base64url"
      ).toString(
        "utf8"
      );

    return JSON.parse(
      json
    ) as ReservationMetadata;
  } catch {
    return null;
  }
}

/* ============================================================
 * Generic helpers
 * ========================================================== */

function getMany2OneId(
  value:
    Many2One
):
  | number
  | false {
  return value
    ? value[0]
    : false;
}

function normalizePhone(
  phone: string
): string {
  return phone.replace(
    /\D/g,
    ""
  );
}

function normalizeCode(
  code: string
): string {
  return code
    .trim()
    .toUpperCase();
}

function isPlaceholder(
  name: string
): boolean {
  return name
    .trim()
    .toLowerCase()
    .includes(
      "placeholder"
    );
}

function isReservation(
  name: string
): boolean {
  return name
    .trim()
    .toLowerCase()
    .startsWith(
      "table reservation"
    );
}

function parseOdooUtc(
  value: string
): Date {
  return new Date(
    `${value.replace(
      " ",
      "T"
    )}Z`
  );
}

function toLagosDate(
  value: string
): string {
  const date =
    parseOdooUtc(
      value
    );

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Africa/Lagos",

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    date
  );
}

function toLagosTime(
  value: string
): string {
  const date =
    parseOdooUtc(
      value
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
 * Reservation code
 * ========================================================== */

async function codeExists(
  code: string
): Promise<boolean> {
  const count =
    await odooCall<number>(
      "calendar.event",

      "search_count",

      [
        [
          [
            "name",
            "ilike",
            `[${code}]`,
          ],
        ],
      ]
    );

  return count >
    0;
}

async function generateReservationCode():
  Promise<string> {
  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {
    const suffix =
      randomBytes(
        3
      )
        .toString(
          "hex"
        )
        .toUpperCase();

    const code =
      `KK-${suffix}`;

    if (
      !(
        await codeExists(
          code
        )
      )
    ) {
      return code;
    }
  }

  throw new Error(
    "Unable to generate a unique reservation code."
  );
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
  "partner_id",
  "appointment_booker_id",
  "resource_ids",
  "appointment_resource_ids",
];

async function readEvents(
  eventIds:
    number[]
): Promise<
  OdooReservationEvent[]
> {
  if (
    eventIds.length ===
    0
  ) {
    return [];
  }

  return odooCall<
    OdooReservationEvent[]
  >(
    "calendar.event",

    "read",

    [
      eventIds,

      EVENT_FIELDS,
    ]
  );
}

async function searchReservationEventsByCode(
  code: string
): Promise<
  OdooReservationEvent[]
> {
  const normalized =
    normalizeCode(
      code
    );

  return odooCall<
    OdooReservationEvent[]
  >(
    "calendar.event",

    "search_read",

    [
      [
        [
          "name",
          "ilike",
          `[${normalized}]`,
        ],

        [
          "name",
          "ilike",
          "Table Reservation",
        ],
      ],

      EVENT_FIELDS,
    ],

    {
      order:
        "start asc, id asc",
    }
  );
}

/* ============================================================
 * Build metadata
 * ========================================================== */

function buildOriginalStates(
  events:
    OdooReservationEvent[]
): OriginalEventState[] {
  return events.map(
    (
      event
    ) => ({
      eventId:
        event.id,

      name:
        event.name,

      partnerId:
        getMany2OneId(
          event.partner_id
        ),

      appointmentBookerId:
        getMany2OneId(
          event
            .appointment_booker_id
        ),

      phoneNumber:
        event.phone_number,

      description:
        event.description,
    })
  );
}

/* ============================================================
 * Claim allocation
 * ========================================================== */

async function claimAllocation({
  allocation,

  reservationCode,

  name,

  phone,

  partySize,

  date,

  time,
}: {
  allocation:
    ReservationAllocation;

  reservationCode:
    string;

  name:
    string;

  phone:
    string;

  partySize:
    number;

  date:
    string;

  time:
    string;
}): Promise<{
  success:
    boolean;

  metadata?:
    ReservationMetadata;

  error?:
    string;
}> {
  const eventIds = [
    ...allocation.eventIds,
  ];

  /**
   * Re-read immediately before claiming.
   */
  const currentEvents =
    await readEvents(
      eventIds
    );

  if (
    currentEvents.length !==
    eventIds.length
  ) {
    return {
      success:
        false,

      error:
        "One or more selected Odoo reservation slots no longer exist.",
    };
  }

  /**
   * Every selected event must still be an untouched placeholder.
   */
  for (
    const event of
      currentEvents
  ) {
    if (
      !isPlaceholder(
        event.name
      )
    ) {
      return {
        success:
          false,

        error:
          "One of the selected tables was just taken by another reservation.",
      };
    }
  }

  const normalizedPhone =
    normalizePhone(
      phone
    );

  const metadata:
    ReservationMetadata = {
    version:
      1,

    reservationCode,

    customerName:
      name.trim(),

    phone:
      normalizedPhone,

    partySize,

    date,

    time,

    allocationType:
      allocation.type,

    eventIds,

    resourceIds:
      allocation.resources.map(
        (
          resource
        ) =>
          resource.id
      ),

    resourceNames:
      allocation.resources.map(
        (
          resource
        ) =>
          resource.name
      ),

    createdAt:
      new Date().toISOString(),

    originalEvents:
      buildOriginalStates(
        currentEvents
      ),
  };

  const description =
    encodeMetadata(
      metadata
    );

  const displayName =
    `Table Reservation — ${name.trim()} [${reservationCode}]`;

  /**
   * One write across all selected events.
   *
   * For a merged reservation both table events receive the same
   * reservation code and metadata.
   */
  const written =
    await odooCall<boolean>(
      "calendar.event",

      "write",

      [
        eventIds,

        {
          name:
            displayName,

          phone_number:
            normalizedPhone ||
            false,

          partner_id:
            DEFAULT_PARTNER_ID,

          appointment_booker_id:
            DEFAULT_PARTNER_ID,

          description,
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
        "Odoo did not confirm the reservation.",
    };
  }

  return {
    success:
      true,

    metadata,
  };
}

/* ============================================================
 * Restore placeholders
 * ========================================================== */

async function restoreFromMetadata(
  metadata:
    ReservationMetadata
): Promise<{
  success:
    boolean;

  error?:
    string;
}> {
  try {
    for (
      const original of
        metadata.originalEvents
    ) {
      const written =
        await odooCall<boolean>(
          "calendar.event",

          "write",

          [
            [
              original.eventId,
            ],

            {
              name:
                original.name,

              partner_id:
                original.partnerId ||
                false,

              appointment_booker_id:
                original
                  .appointmentBookerId ||
                false,

              phone_number:
                original.phoneNumber ||
                false,

              description:
                original.description ||
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
            `Odoo failed to restore placeholder event ${original.eventId}.`,
        };
      }
    }

    return {
      success:
        true,
    };
  } catch (
    error
  ) {
    return {
      success:
        false,

      error:
        error instanceof
        Error
          ? error.message
          : "Unable to restore Odoo placeholders.",
    };
  }
}

/* ============================================================
 * CREATE
 * ========================================================== */

export async function createOdooReservation({
  name,

  phone,

  partySize,

  date,

  time,
}: {
  name:
    string;

  phone:
    string;

  partySize:
    number;

  date:
    string;

  time:
    string;
}): Promise<
  OdooReservationResult
> {
  if (
    !name.trim()
  ) {
    return {
      success:
        false,

      error:
        "Customer name is required.",
    };
  }

  if (
    !Number.isInteger(
      partySize
    ) ||
    partySize <
      1 ||
    partySize >
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
   * Fresh allocation at the moment Confirm is pressed.
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

  const reservationCode =
    await generateReservationCode();

  const claimed =
    await claimAllocation({
      allocation,

      reservationCode,

      name,

      phone,

      partySize,

      date,

      time,
    });

  if (
    !claimed.success
  ) {
    return {
      success:
        false,

      reason:
        "slot_unavailable",

      error:
        claimed.error,
    };
  }

  return {
    success:
      true,

    reservationCode,

    eventIds: [
      ...allocation.eventIds,
    ],

    allocationType:
      allocation.type,

    resources:
      allocation.resources.map(
        (
          resource
        ) => ({
          id:
            resource.id,

          name:
            resource.name,

          capacity:
            resource.capacity,
        })
      ),
  };
}

/* ============================================================
 * Convert Odoo event(s) to lookup response
 * ========================================================== */

function reservationFromEvents(
  events:
    OdooReservationEvent[]
): OdooReservationLookup {
  if (
    events.length ===
    0
  ) {
    return {
      success:
        false,

      error:
        "Reservation not found.",
    };
  }

  const first =
    events[0];

  const metadata =
    decodeMetadata(
      first.description
    );

  /**
   * New Odoo-only reservations should always have metadata.
   */
  if (
    metadata
  ) {
    return {
      success:
        true,

      reservationCode:
        metadata
          .reservationCode,

      name:
        metadata
          .customerName,

      phone:
        metadata.phone,

      partySize:
        metadata
          .partySize,

      date:
        metadata.date,

      time:
        metadata.time,

      status:
        "confirmed",

      eventIds:
        metadata.eventIds,

      resources:
        metadata
          .resourceNames,
    };
  }

  /**
   * Fallback for an older reservation created before this metadata
   * format existed.
   */
  return {
    success:
      true,

    name:
      first.name,

    phone:
      first.phone_number ||
      undefined,

    date:
      toLagosDate(
        first.start
      ),

    time:
      toLagosTime(
        first.start
      ),

    status:
      "confirmed",

    eventIds:
      events.map(
        (
          event
        ) =>
          event.id
      ),
  };
}

/* ============================================================
 * LOOKUP BY CODE
 * ========================================================== */

export async function getOdooReservationByCode(
  code: string
): Promise<
  OdooReservationLookup
> {
  const normalized =
    normalizeCode(
      code
    );

  if (
    normalized.length <
    4
  ) {
    return {
      success:
        false,

      error:
        "Invalid reservation code.",
    };
  }

  const events =
    await searchReservationEventsByCode(
      normalized
    );

  if (
    events.length ===
    0
  ) {
    return {
      success:
        false,

      error:
        "Reservation not found.",
    };
  }

  return reservationFromEvents(
    events
  );
}

/* ============================================================
 * LOOKUP BY PHONE
 * ========================================================== */

export async function getOdooReservationByPhone(
  phone: string
): Promise<
  OdooReservationLookup
> {
  const normalizedPhone =
    normalizePhone(
      phone
    );

  if (
    normalizedPhone.length <
    9
  ) {
    return {
      success:
        false,

      error:
        "Please provide a valid phone number.",
    };
  }

  const events =
    await odooCall<
      OdooReservationEvent[]
    >(
      "calendar.event",

      "search_read",

      [
        [
          [
            "phone_number",
            "=",
            normalizedPhone,
          ],

          [
            "name",
            "ilike",
            "Table Reservation",
          ],
        ],

        EVENT_FIELDS,
      ],

      {
        order:
          "start asc, id asc",
      }
    );

  if (
    events.length ===
    0
  ) {
    return {
      success:
        false,

      error:
        "I couldn't find a reservation with that phone number.",
    };
  }

  /**
   * Multiple events may belong to ONE merged reservation.
   *
   * Group them by reservation code from metadata.
   */
  const firstMetadata =
    decodeMetadata(
      events[0]
        .description
    );

  if (
    firstMetadata
  ) {
    const matchingEvents =
      events.filter(
        (
          event
        ) => {
          const meta =
            decodeMetadata(
              event.description
            );

          return (
            meta
              ?.reservationCode ===
            firstMetadata
              .reservationCode
          );
        }
      );

    return reservationFromEvents(
      matchingEvents
    );
  }

  return reservationFromEvents(
    [
      events[0],
    ]
  );
}

/* ============================================================
 * CANCEL
 * ========================================================== */

export async function cancelOdooReservation(
  code: string
): Promise<{
  success:
    boolean;

  error?:
    string;
}> {
  const events =
    await searchReservationEventsByCode(
      code
    );

  if (
    events.length ===
    0
  ) {
    return {
      success:
        false,

      error:
        "Reservation not found.",
    };
  }

  const metadata =
    decodeMetadata(
      events[0]
        .description
    );

  if (
    !metadata
  ) {
    /**
     * I would rather fail safely than blindly convert an older event
     * into a placeholder without knowing its original state.
     */
    return {
      success:
        false,

      error:
        "This reservation was created before Odoo reservation metadata was enabled. Please cancel it manually in Odoo.",
    };
  }

  return restoreFromMetadata(
    metadata
  );
}

/* ============================================================
 * MODIFY
 * ========================================================== */

export async function modifyOdooReservation(
  code: string,

  newDate: string,

  newTime: string
): Promise<{
  success:
    boolean;

  error?:
    string;

  reason?:
    string;
}> {
  const currentEvents =
    await searchReservationEventsByCode(
      code
    );

  if (
    currentEvents.length ===
    0
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

  const currentMetadata =
    decodeMetadata(
      currentEvents[0]
        .description
    );

  if (
    !currentMetadata
  ) {
    return {
      success:
        false,

      reason:
        "legacy_reservation",

      error:
        "This reservation must be modified manually in Odoo.",
    };
  }

  /**
   * User picked the same date/time.
   */
  if (
    currentMetadata.date ===
      newDate &&
    currentMetadata.time ===
      newTime
  ) {
    return {
      success:
        true,
    };
  }

  /**
   * Find NEW free tables.
   *
   * The existing reservation isn't considered free because its
   * events no longer contain "Placeholder".
   */
  const newAllocation =
    await findBestAllocation(
      newDate,

      newTime,

      currentMetadata.partySize
    );

  if (
    !newAllocation
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
   * Claim new allocation FIRST.
   *
   * This prevents us from releasing the customer's existing table
   * before knowing the new table can actually be secured.
   */
  const claimResult =
    await claimAllocation({
      allocation:
        newAllocation,

      reservationCode:
        currentMetadata
          .reservationCode,

      name:
        currentMetadata
          .customerName,

      phone:
        currentMetadata.phone,

      partySize:
        currentMetadata
          .partySize,

      date:
        newDate,

      time:
        newTime,
    });

  if (
    !claimResult.success
  ) {
    return {
      success:
        false,

      reason:
        "slot_unavailable",

      error:
        claimResult.error,
    };
  }

  /**
   * New tables are secured.
   *
   * Now release the old table(s).
   */
  const releaseOld =
    await restoreFromMetadata(
      currentMetadata
    );

  if (
    !releaseOld.success
  ) {
    /**
     * Best-effort rollback:
     *
     * release the NEW allocation again if the old allocation could
     * not be released.
     */
    if (
      claimResult.metadata
    ) {
      await restoreFromMetadata(
        claimResult.metadata
      );
    }

    return {
      success:
        false,

      reason:
        "odoo_reschedule_failed",

      error:
        releaseOld.error ??
        "Unable to release the previous reservation tables.",
    };
  }

  return {
    success:
      true,
  };
}