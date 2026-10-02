"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Placeholder = {
  id: number;

  name: string;

  start: string;

  stop: string;

  capacity: number;

  available: boolean;

  partnerId:
    | number
    | false;

  resourceId?: number;

  resourceName?: string;

  appointmentStatus?:
    | string
    | false;

  totalCapacityReserved?: number;

  totalCapacityUsed?: number;

  bookingLineIds?: number[];
};

type AvailabilityOption = {
  eventId: number;

  label: string;

  start: string;

  stop: string;

  time: string;

  resourceId: number;

  resourceName: string;

  capacity: number;
};

type AvailabilityTime = {
  time: string;

  options:
    AvailabilityOption[];
};

type AvailabilityResponse = {
  date: string;

  partySize: number;

  times:
    AvailabilityTime[];
};

type Props = {
  initialSlots:
    Placeholder[];

  error:
    | string
    | null;

  odooBaseUrl: string;
};

type SlotStatus =
  | "available"
  | "reserved"
  | "placeholder"
  | "issue"
  | "past";

type CalendarSlot =
  Placeholder & {
    date: string;

    startTime: string;

    endTime: string;

    status: SlotStatus;

    resource: string;
  };

export default function OdooSlotsBoard({
  initialSlots,

  error,

  odooBaseUrl,
}: Props) {
  const router =
    useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<
      CalendarSlot | null
    >(null);

  const [
    availabilityDate,
    setAvailabilityDate,
  ] =
    useState("");

  const [
    partySize,
    setPartySize,
  ] =
    useState(2);

  const [
    availability,
    setAvailability,
  ] =
    useState<
      AvailabilityResponse | null
    >(null);

  const [
    availabilityLoading,
    setAvailabilityLoading,
  ] =
    useState(false);

  const [
    availabilityError,
    setAvailabilityError,
  ] =
    useState<
      string | null
    >(null);

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(() => {
    const firstSlot =
      initialSlots[0];

    if (
      firstSlot?.start
    ) {
      const parsed =
        parseOdooUtcDateForLagos(
          firstSlot.start
        );

      if (parsed) {
        return new Date(
          parsed.year,
          parsed.month - 1,
          1
        );
      }
    }

    const now =
      new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  });

  const slots =
    useMemo<
      CalendarSlot[]
    >(() => {
      return initialSlots
        .map(
          (slot) => {
            const start =
              parseOdooUtcDateForLagos(
                slot.start
              );

            const stop =
              parseOdooUtcDateForLagos(
                slot.stop
              );

            if (
              !start ||
              !stop
            ) {
              return null;
            }

            const resource =
              slot.resourceName?.trim() ||
              slot.name ||
              `Slot ${slot.id}`;

            return {
              ...slot,

              resource,

              date:
                dateKey(
                  start.year,
                  start.month,
                  start.day
                ),

              startTime:
                formatTime(
                  start.hour,
                  start.minute
                ),

              endTime:
                formatTime(
                  stop.hour,
                  stop.minute
                ),

              status:
                getSlotStatus(
                  slot,
                  start
                ),
            };
          }
        )
        .filter(
          (
            slot
          ): slot is CalendarSlot =>
            slot !== null
        );
    }, [
      initialSlots,
    ]);

  const year =
    visibleMonth.getFullYear();

  const month =
    visibleMonth.getMonth();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const days =
    useMemo(
      () =>
        Array.from(
          {
            length:
              daysInMonth,
          },

          (
            _,
            index
          ) =>
            index + 1
        ),

      [
        daysInMonth,
      ]
    );

  const monthSlots =
    useMemo(() => {
      return slots.filter(
        (slot) => {
          const parsed =
            parseDateKey(
              slot.date
            );

          return (
            parsed.year ===
              year &&
            parsed.month ===
              month + 1
          );
        }
      );
    }, [
      slots,
      year,
      month,
    ]);

  const resources =
    useMemo(() => {
      return Array.from(
        new Set(
          monthSlots.map(
            (slot) =>
              slot.resource
          )
        )
      ).sort(
        naturalSort
      );
    }, [
      monthSlots,
    ]);

  const groupedSlots =
    useMemo(() => {
      const map =
        new Map<
          string,
          CalendarSlot[]
        >();

      for (
        const slot of
        monthSlots
      ) {
        const key =
          `${slot.resource}::${slot.date}`;

        const existing =
          map.get(key) ??
          [];

        existing.push(
          slot
        );

        map.set(
          key,
          existing
        );
      }

      for (
        const group of
        map.values()
      ) {
        group.sort(
          (a, b) =>
            a.start.localeCompare(
              b.start
            )
        );
      }

      return map;
    }, [
      monthSlots,
    ]);

  async function checkAvailability() {
    if (
      !availabilityDate
    ) {
      setAvailabilityError(
        "Select a date first."
      );

      return;
    }

    if (
      !Number.isInteger(
        partySize
      ) ||
      partySize <= 0
    ) {
      setAvailabilityError(
        "Party size must be at least 1."
      );

      return;
    }

    setAvailabilityLoading(
      true
    );

    setAvailabilityError(
      null
    );

    try {
      const params =
        new URLSearchParams({
          date:
            availabilityDate,

          partySize:
            String(
              partySize
            ),
        });

      const res =
        await fetch(
          `/dashboard/odoo-slots/availability?${params.toString()}`,

          {
            cache:
              "no-store",
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Unable to load availability."
        );
      }

      setAvailability(
        data
      );
    } catch (error) {
      setAvailability(
        null
      );

      setAvailabilityError(
        error instanceof Error
          ? error.message
          : "Unable to load availability."
      );
    } finally {
      setAvailabilityLoading(
        false
      );
    }
  }

  function goPreviousMonth() {
    setVisibleMonth(
      new Date(
        year,
        month - 1,
        1
      )
    );

    setSelectedSlot(
      null
    );
  }

  function goNextMonth() {
    setVisibleMonth(
      new Date(
        year,
        month + 1,
        1
      )
    );

    setSelectedSlot(
      null
    );
  }

  function goToToday() {
    const now =
      new Date();

    setVisibleMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );

    setSelectedSlot(
      null
    );
  }

  function refreshFromOdoo() {
    startTransition(
      () => {
        router.refresh();
      }
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-admin-ink">
            Odoo Reservation Slots
          </h1>

          <p className="mt-1 text-sm text-admin-muted">
            Live restaurant reservation inventory from Odoo.
          </p>
        </div>

        <button
          type="button"
          onClick={
            refreshFromOdoo
          }
          disabled={
            isPending
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-4 text-sm font-medium text-admin-ink transition hover:bg-admin-border/40 disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshIcon />

          {isPending
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      {/* Availability tester */}
      <section className="rounded-xl border border-admin-border bg-admin-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-admin-ink">
              Availability Test
            </h2>

            <p className="mt-1 text-sm text-admin-muted">
              Choose a date and party size to test the same availability logic the customer will use.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[180px_140px_auto]">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-admin-muted">
                Date
              </span>

              <input
                type="date"
                value={
                  availabilityDate
                }
                onChange={(
                  event
                ) =>
                  setAvailabilityDate(
                    event
                      .target
                      .value
                  )
                }
                className="h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-admin-muted">
                Party size
              </span>

              <input
                type="number"
                min={1}
                value={
                  partySize
                }
                onChange={(
                  event
                ) =>
                  setPartySize(
                    Math.max(
                      1,
                      Number(
                        event
                          .target
                          .value
                      ) ||
                        1
                    )
                  )
                }
                className="h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none"
              />
            </label>

            <button
              type="button"
              onClick={
                checkAvailability
              }
              disabled={
                availabilityLoading
              }
              className="h-10 self-end rounded-lg bg-admin-ink px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              {availabilityLoading
                ? "Checking..."
                : "Find availability"}
            </button>
          </div>
        </div>

        {availabilityError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {
              availabilityError
            }
          </div>
        )}

        {availability && (
          <div className="mt-5 border-t border-admin-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-admin-ink">
                  Available times
                </p>

                <p className="mt-1 text-xs text-admin-muted">
                  {
                    availability.partySize
                  }{" "}
                  guest
                  {availability.partySize ===
                  1
                    ? ""
                    : "s"}{" "}
                  ·{" "}
                  {
                    availability.date
                  }
                </p>
              </div>

              <span className="text-xs text-admin-subtle">
                {
                  availability
                    .times
                    .length
                }{" "}
                available time
                {availability
                  .times
                  .length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>

            {availability.times
              .length === 0 ? (
              <div className="mt-4 rounded-lg border border-admin-border bg-admin-bg px-4 py-6 text-sm text-admin-muted">
                No matching placeholders were found for this date and party size.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {availability.times.map(
                  (
                    group
                  ) => (
                    <div
                      key={
                        group.time
                      }
                      className="rounded-lg border border-admin-border bg-admin-bg p-4"
                    >
                      <div className="text-xl font-semibold text-admin-ink">
                        {
                          group.time
                        }
                      </div>

                      <p className="mt-1 text-xs text-admin-muted">
                        {
                          group
                            .options
                            .length
                        }{" "}
                        suitable table
                        {group
                          .options
                          .length ===
                        1
                          ? ""
                          : "s"}
                      </p>

                      <div className="mt-3 space-y-2">
                        {group.options.map(
                          (
                            option
                          ) => (
                            <div
                              key={
                                option.eventId
                              }
                              className="flex items-center justify-between gap-3 rounded-md border border-admin-border bg-admin-surface px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-admin-ink">
                                  {
                                    option.resourceName
                                  }
                                </p>

                                <p className="mt-0.5 text-[11px] text-admin-subtle">
                                  Event #
                                  {
                                    option.eventId
                                  }
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full border border-admin-border px-2 py-1 text-[11px] text-admin-muted">
                                {
                                  option.capacity
                                }{" "}
                                seats
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Month controls */}
      <section className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={
            goPreviousMonth
          }
          aria-label="Previous month"
          className="calendar-nav-button"
        >
          <ChevronLeftIcon />
        </button>

        <h2 className="min-w-[170px] text-center text-base font-semibold text-admin-ink">
          {formatMonthTitle(
            visibleMonth
          )}
        </h2>

        <button
          type="button"
          onClick={
            goNextMonth
          }
          aria-label="Next month"
          className="calendar-nav-button"
        >
          <ChevronRightIcon />
        </button>

        <button
          type="button"
          onClick={
            goToToday
          }
          className="ml-2 h-9 rounded-lg border border-admin-border bg-admin-surface px-3 text-xs font-medium text-admin-ink"
        >
          Today
        </button>
      </section>

      {/* Legend */}
      <section className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-admin-muted">
        <Legend
          color="bg-emerald-500"
          label="Available"
        />

        <Legend
          color="bg-rose-400"
          label="Reserved"
        />

        <Legend
          color="bg-blue-400"
          label="Placeholder"
        />

        <Legend
          color="bg-amber-400"
          label="Issue"
        />

        <Legend
          color="bg-zinc-400"
          label="Past"
        />
      </section>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">
            Odoo could not be loaded
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        </section>
      ) : (
        <div
          className={[
            "grid min-w-0 gap-4",

            selectedSlot
              ? "xl:grid-cols-[minmax(0,1fr)_300px]"
              : "grid-cols-1",
          ].join(
            " "
          )}
        >
          <div className="min-w-0">
            <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
              {/* day header */}
              <div
                className="grid border-b border-admin-border"
                style={{
                  gridTemplateColumns:
                    `150px repeat(${days.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="border-r border-admin-border px-4 py-3 text-sm font-semibold text-admin-ink">
                  Tables
                </div>

                {days.map(
                  (
                    day
                  ) => (
                    <div
                      key={
                        day
                      }
                      className="border-r border-admin-border py-3 text-center text-[10px] text-admin-muted"
                    >
                      {String(
                        day
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>
                  )
                )}
              </div>

              {resources.length ===
              0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-medium text-admin-ink">
                    No reservation slots
                  </p>

                  <p className="mt-1 text-sm text-admin-muted">
                    No Odoo events for this month.
                  </p>
                </div>
              ) : (
                resources.map(
                  (
                    resource
                  ) => (
                    <ResourceRow
                      key={
                        resource
                      }
                      resource={
                        resource
                      }
                      year={
                        year
                      }
                      month={
                        month
                      }
                      days={
                        days
                      }
                      groupedSlots={
                        groupedSlots
                      }
                      selectedSlot={
                        selectedSlot
                      }
                      onSelect={
                        setSelectedSlot
                      }
                    />
                  )
                )
              )}
            </section>
          </div>

          {selectedSlot && (
            <SlotDetails
              slot={
                selectedSlot
              }
              odooBaseUrl={
                odooBaseUrl
              }
              onClose={() =>
                setSelectedSlot(
                  null
                )
              }
            />
          )}
        </div>
      )}

      <style jsx global>{`
        .calendar-nav-button {
          display: inline-flex;
          height: 36px;
          width: 36px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--admin-border, #dedbd5);
          background: var(--admin-surface, #fff);
          color: var(--admin-ink, #29251f);
        }
      `}</style>
    </div>
  );
}

function ResourceRow({
  resource,

  year,

  month,

  days,

  groupedSlots,

  selectedSlot,

  onSelect,
}: {
  resource: string;

  year: number;

  month: number;

  days: number[];

  groupedSlots:
    Map<
      string,
      CalendarSlot[]
    >;

  selectedSlot:
    CalendarSlot | null;

  onSelect:
    (
      slot:
        CalendarSlot
    ) => void;
}) {
  return (
    <div
      className="grid border-b border-admin-border last:border-b-0"
      style={{
        gridTemplateColumns:
          `150px repeat(${days.length}, minmax(0, 1fr))`,
      }}
    >
      <div className="min-h-[72px] border-r border-admin-border px-3 py-3">
        <p className="truncate text-sm font-medium text-admin-ink">
          {resource}
        </p>

        <p className="mt-0.5 text-[10px] text-admin-subtle">
          Odoo resource
        </p>
      </div>

      {days.map(
        (
          day
        ) => {
          const date =
            dateKey(
              year,
              month + 1,
              day
            );

          const cellSlots =
            groupedSlots.get(
              `${resource}::${date}`
            ) ?? [];

          return (
            <div
              key={
                day
              }
              className="min-w-0 border-r border-admin-border p-[2px]"
            >
              <div className="space-y-[2px]">
                {cellSlots.map(
                  (
                    slot
                  ) => (
                    <CompactSlot
                      key={
                        slot.id
                      }
                      slot={
                        slot
                      }
                      selected={
                        selectedSlot?.id ===
                        slot.id
                      }
                      onClick={() =>
                        onSelect(
                          slot
                        )
                      }
                    />
                  )
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function CompactSlot({
  slot,

  selected,

  onClick,
}: {
  slot: CalendarSlot;

  selected: boolean;

  onClick: () => void;
}) {
  const styles:
    Record<
      SlotStatus,
      string
    > = {
    available:
      "bg-emerald-400/80 border-emerald-500",

    reserved:
      "bg-rose-400/80 border-rose-500",

    placeholder:
      "bg-blue-400/80 border-blue-500",

    issue:
      "bg-amber-400/80 border-amber-500",

    past:
      "bg-zinc-300 border-zinc-400",
  };

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      title={`${slot.name}
${slot.startTime} – ${slot.endTime}
Capacity: ${slot.capacity}`}
      className={[
        "block h-5 w-full rounded-[3px] border transition hover:brightness-95",

        styles[
          slot.status
        ],

        selected
          ? "ring-2 ring-admin-ink ring-offset-1"
          : "",
      ].join(
        " "
      )}
    >
      <span className="sr-only">
        {slot.name}
      </span>
    </button>
  );
}

function SlotDetails({
  slot,

  odooBaseUrl,

  onClose,
}: {
  slot: CalendarSlot;

  odooBaseUrl: string;

  onClose: () => void;
}) {
  const odooLink =
    odooBaseUrl
      ? `${odooBaseUrl.replace(/\/$/, "")}/web#id=${slot.id}&model=calendar.event&view_type=form`
      : null;

  return (
    <aside className="self-start rounded-xl border border-admin-border bg-admin-surface p-5 xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusPill
            status={
              slot.status
            }
          />

          <h2 className="mt-3 font-display text-xl text-admin-ink">
            {slot.name}
          </h2>

          <p className="mt-1 text-xs text-admin-subtle">
            Odoo Event #
            {slot.id}
          </p>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          className="rounded-md p-2 text-admin-muted"
        >
          ×
        </button>
      </div>

      <dl className="mt-6 space-y-4 text-sm">
        <Detail
          label="Table"
          value={
            slot.resource
          }
        />

        <Detail
          label="Date"
          value={
            formatDateLabel(
              slot.date
            )
          }
        />

        <Detail
          label="Time"
          value={`${slot.startTime} – ${slot.endTime}`}
        />

        <Detail
          label="Table capacity"
          value={
            slot.capacity >
            0
              ? `${slot.capacity} seats`
              : "Not configured"
          }
        />

        <Detail
          label="Status"
          value={
            getDisplayAvailability(
              slot
            )
          }
        />

        {typeof slot.totalCapacityReserved ===
          "number" && (
          <Detail
            label="Reserved capacity"
            value={String(
              slot.totalCapacityReserved
            )}
          />
        )}

        {typeof slot.totalCapacityUsed ===
          "number" && (
          <Detail
            label="Used capacity"
            value={String(
              slot.totalCapacityUsed
            )}
          />
        )}
      </dl>

      {odooLink && (
        <div className="mt-6 border-t border-admin-border pt-5">
          <a
            href={
              odooLink
            }
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center justify-center rounded-lg border border-admin-border text-sm font-medium text-admin-ink"
          >
            Open in Odoo
          </a>
        </div>
      )}
    </aside>
  );
}

/* ============================================================
 * Status
 * ========================================================== */

function getSlotStatus(
  slot: Placeholder,

  start: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  }
): SlotStatus {
  const startDate =
    new Date(
      start.year,
      start.month - 1,
      start.day,
      start.hour,
      start.minute
    );

  const isPast =
    startDate.getTime() <
    Date.now();

  const normalized =
    slot.name
      .trim()
      .toLowerCase();

  if (
    normalized.includes(
      "placeholder"
    )
  ) {
    return isPast
      ? "past"
      : "placeholder";
  }

  if (
    normalized.startsWith(
      "table reservation"
    )
  ) {
    return isPast
      ? "past"
      : "reserved";
  }

  if (isPast) {
    return "past";
  }

  if (
    !slot.resourceId ||
    !slot.resourceName
  ) {
    return "issue";
  }

  if (
    slot.available
  ) {
    return "available";
  }

  return "reserved";
}

function getDisplayAvailability(
  slot: CalendarSlot
): string {
  switch (
    slot.status
  ) {
    case "placeholder":
      return "Placeholder / Open";

    case "available":
      return "Available";

    case "reserved":
      return "Reserved";

    case "past":
      return "Past";

    case "issue":
      return "Configuration issue";
  }
}

/* ============================================================
 * Lagos datetime parser
 *
 * Odoo returns UTC strings such as:
 *
 * 2026-10-03 15:00:00
 *
 * which is:
 *
 * 16:00 Lagos
 * ========================================================== */

function parseOdooUtcDateForLagos(
  value: string
) {
  const utc =
    new Date(
      `${value.replace(
        " ",
        "T"
      )}Z`
    );

  if (
    Number.isNaN(
      utc.getTime()
    )
  ) {
    return null;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Africa/Lagos",

        year: "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,
      }
    ).formatToParts(
      utc
    );

  const values =
    Object.fromEntries(
      parts.map(
        (
          part
        ) => [
          part.type,
          part.value,
        ]
      )
    );

  return {
    year:
      Number(
        values.year
      ),

    month:
      Number(
        values.month
      ),

    day:
      Number(
        values.day
      ),

    hour:
      Number(
        values.hour
      ),

    minute:
      Number(
        values.minute
      ),
  };
}

/* ============================================================
 * UI helpers
 * ========================================================== */

function dateKey(
  year: number,

  month: number,

  day: number
) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateKey(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return {
    year,
    month,
    day,
  };
}

function formatTime(
  hour: number,

  minute: number
) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatMonthTitle(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

function formatDateLabel(
  value: string
) {
  const {
    year,
    month,
    day,
  } =
    parseDateKey(
      value
    );

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday:
        "short",

      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
  );
}

function naturalSort(
  a: string,

  b: string
) {
  return a.localeCompare(
    b,
    undefined,
    {
      numeric: true,

      sensitivity:
        "base",
    }
  );
}

function Legend({
  color,

  label,
}: {
  color: string;

  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      {label}
    </span>
  );
}

function StatusPill({
  status,
}: {
  status:
    SlotStatus;
}) {
  const config = {
    available: [
      "Available",

      "bg-emerald-50 text-emerald-700",
    ],

    reserved: [
      "Reserved",

      "bg-rose-50 text-rose-700",
    ],

    placeholder: [
      "Placeholder",

      "bg-blue-50 text-blue-700",
    ],

    issue: [
      "Configuration issue",

      "bg-amber-50 text-amber-700",
    ],

    past: [
      "Past",

      "bg-zinc-100 text-zinc-600",
    ],
  } as const;

  const [
    label,
    classes,
  ] =
    config[
      status
    ];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function Detail({
  label,

  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>
      <dt className="text-xs text-admin-subtle">
        {label}
      </dt>

      <dd className="mt-1 font-medium text-admin-ink">
        {value}
      </dd>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 8" />
      <path d="M5.5 15A7 7 0 0 0 17.8 17.8L20 16" />
    </svg>
  );
}