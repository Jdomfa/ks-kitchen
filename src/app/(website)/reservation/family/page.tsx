"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type FamilySlot = {
  date: string;
  time: string;
};

type PageMode =
  | "reservation"
  | "another-day"
  | "reservation-success"
  | "interest-success";

type ApiResponse = {
  success?: boolean;
  error?: string;
  slots?: FamilySlot[];
};

async function readJsonResponse(
  response: Response,
): Promise<ApiResponse> {
  const text =
    await response.text();

  if (!text) {
    throw new Error(
      `Empty response from server (${response.status}).`,
    );
  }

  try {
    return JSON.parse(
      text,
    ) as ApiResponse;
  } catch {
    console.error(
      "Non-JSON API response:",
      text,
    );

    throw new Error(
      `Server returned an invalid response (${response.status}).`,
    );
  }
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00Z`,
    ),
  );
}

function formatTime(
  value: string,
) {
  const [
    hourString,
    minute,
  ] =
    value.split(":");

  const hour =
    Number(
      hourString,
    );

  const period =
    hour >= 12
      ? "PM"
      : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

export default function FamilyReservationPage() {
  const [
    slots,
    setSlots,
  ] =
    useState<FamilySlot[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    mode,
    setMode,
  ] =
    useState<PageMode>(
      "reservation",
    );

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    partySize,
    setPartySize,
  ] =
    useState(2);

  const [
    date,
    setDate,
  ] =
    useState("");

  const [
    time,
    setTime,
  ] =
    useState("");

  async function loadSlots() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/family-reservations?partySize=${partySize}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const data =
        await readJsonResponse(
          response,
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
            "Unable to load availability.",
        );
      }

      setSlots(
        Array.isArray(
          data.slots,
        )
          ? data.slots
          : [],
      );
    } catch (
      err
    ) {
      console.error(
        "Family reservation availability error:",
        err,
      );

      setSlots([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load available reservation times.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      mode ===
      "reservation"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadSlots();
    }
  }, [
    partySize,
    mode,
  ]);

  const dates =
    useMemo(
      () =>
        Array.from(
          new Set(
            slots.map(
              (
                slot,
              ) =>
                slot.date,
            ),
          ),
        ).sort(),
      [
        slots,
      ],
    );

  const availableTimes =
    useMemo(
      () =>
        slots
          .filter(
            (
              slot,
            ) =>
              slot.date ===
              date,
          )
          .map(
            (
              slot,
            ) =>
              slot.time,
          )
          .sort(
            (
              a,
              b,
            ) =>
              a.localeCompare(
                b,
              ),
          ),
      [
        slots,
        date,
      ],
    );

  useEffect(() => {
    if (
      date &&
      !dates.includes(
        date,
      )
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate("");
      setTime("");
    }
  }, [
    date,
    dates,
  ]);

  async function handleReservationSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError(
        "Please enter your name.",
      );

      return;
    }

    if (
      phone
        .replace(
          /\D/g,
          "",
        )
        .length < 9
    ) {
      setError(
        "Please enter a valid phone number.",
      );

      return;
    }

    if (
      !date ||
      !time
    ) {
      setError(
        "Please choose a date and time.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          "/api/family-reservations",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                phone:
                  phone.trim(),

                partySize,

                date,

                time,
              }),
          },
        );

      const data =
        await readJsonResponse(
          response,
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
            "Unable to create reservation.",
        );
      }

      setMode(
        "reservation-success",
      );
    } catch (
      err
    ) {
      console.error(
        "Family reservation booking error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create reservation.",
      );

      await loadSlots();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnotherDaySubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError(
        "Please enter your name.",
      );

      return;
    }

    if (
      phone
        .replace(
          /\D/g,
          "",
        )
        .length < 9
    ) {
      setError(
        "Please enter a valid phone number.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          "/api/family-interest",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                phone:
                  phone.trim(),
              }),
          },
        );

      const data =
        await readJsonResponse(
          response,
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
            "Unable to save your details.",
        );
      }

      setMode(
        "interest-success",
      );
    } catch (
      err
    ) {
      console.error(
        "Another day submission error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your details.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetReservation() {
    setName("");
    setPhone("");
    setPartySize(2);
    setDate("");
    setTime("");
    setError(null);

    setMode(
      "reservation",
    );
  }

  if (
    mode ===
    "reservation-success"
  ) {
    return (
      <main className="min-h-screen bg-coconut-cream px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-tamarind-bark/10 bg-surface p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-clay-pot">
            K&apos;s Kitchen
          </p>

          <h1 className="mt-4 font-display text-3xl text-roasted-coffee">
            Reservation confirmed
          </h1>

          <p className="mt-4 text-tamarind-bark">
            Your table has been
            reserved successfully.
          </p>

          <p className="mt-2 text-sm text-tamarind-bark/70">
            A confirmation will be
            sent to your WhatsApp
            number.
          </p>

          <button
            type="button"
            onClick={
              resetReservation
            }
            className="mt-7 rounded-full bg-banana-leaf px-7 py-3 font-medium text-coconut-cream"
          >
            Make another reservation
          </button>
        </div>
      </main>
    );
  }

  if (
    mode ===
    "interest-success"
  ) {
    return (
      <main className="min-h-screen bg-coconut-cream px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-tamarind-bark/10 bg-surface p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-clay-pot">
            K&apos;s Kitchen
          </p>

          <h1 className="mt-4 font-display text-3xl text-roasted-coffee">
            Thank you
          </h1>

          <p className="mt-4 text-tamarind-bark">
            We&apos;ve received your
            details.
          </p>

          <p className="mt-2 text-sm text-tamarind-bark/70">
            Our team can contact you
            regarding another
            reservation day.
          </p>

          <button
            type="button"
            onClick={
              resetReservation
            }
            className="mt-7 rounded-full bg-banana-leaf px-7 py-3 font-medium text-coconut-cream"
          >
            Back to reservations
          </button>
        </div>
      </main>
    );
  }

  if (
    mode ===
    "another-day"
  ) {
    return (
      <main className="min-h-screen bg-coconut-cream px-5 py-12 md:py-20">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-clay-pot">
              K&apos;s Kitchen
            </p>

            <h1 className="mt-3 font-display text-4xl text-roasted-coffee">
              Another day
            </h1>

            <p className="mt-3 text-tamarind-bark/70">
              Leave your name and
              phone number and our
              team can contact you.
            </p>
          </div>

          <form
            onSubmit={
              handleAnotherDaySubmit
            }
            className="space-y-6 rounded-3xl border border-tamarind-bark/10 bg-surface p-6 shadow-xl md:p-9"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-roasted-coffee">
                Name
              </label>

              <input
                value={
                  name
                }
                onChange={(
                  event,
                ) =>
                  setName(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Your name"
                autoComplete="name"
                className="w-full rounded-xl border border-tamarind-bark/20 bg-coconut-cream px-4 py-3 outline-none focus:border-clay-pot"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-roasted-coffee">
                Phone number
              </label>

              <input
                value={
                  phone
                }
                onChange={(
                  event,
                ) =>
                  setPhone(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="08012345678"
                inputMode="tel"
                autoComplete="tel"
                className="w-full rounded-xl border border-tamarind-bark/20 bg-coconut-cream px-4 py-3 outline-none focus:border-clay-pot"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-alert/10 px-4 py-3 text-sm text-alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting
              }
              className="w-full rounded-full bg-banana-leaf px-6 py-4 font-medium text-coconut-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting
                ? "Submitting..."
                : "Submit"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);

                setMode(
                  "reservation",
                );
              }}
              className="w-full rounded-full border border-banana-leaf px-6 py-4 font-medium text-banana-leaf transition hover:bg-banana-leaf/5"
            >
              Back
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-coconut-cream px-5 py-12 md:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-clay-pot">
            K&apos;s Kitchen
          </p>

          <h1 className="mt-3 font-display text-4xl text-roasted-coffee">
            Reserve a table
          </h1>

          <p className="mt-3 text-tamarind-bark/70">
            Choose from the
            available reservation
            times below.
          </p>
        </div>

        <form
          onSubmit={
            handleReservationSubmit
          }
          className="space-y-7 rounded-3xl border border-tamarind-bark/10 bg-surface p-6 shadow-xl md:p-9"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-roasted-coffee">
              Name
            </label>

            <input
              value={
                name
              }
              onChange={(
                event,
              ) =>
                setName(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Reservation name"
              autoComplete="name"
              className="w-full rounded-xl border border-tamarind-bark/20 bg-coconut-cream px-4 py-3 outline-none focus:border-clay-pot"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-roasted-coffee">
              Phone number
            </label>

            <input
              value={
                phone
              }
              onChange={(
                event,
              ) =>
                setPhone(
                  event
                    .target
                    .value,
                )
              }
              placeholder="08012345678"
              inputMode="tel"
              autoComplete="tel"
              className="w-full rounded-xl border border-tamarind-bark/20 bg-coconut-cream px-4 py-3 outline-none focus:border-clay-pot"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-roasted-coffee">
              Number of guests
            </label>

            <div className="grid grid-cols-4 gap-2">
              {[
                1,
                2,
                3,
                4,
              ].map(
                (
                  number,
                ) => (
                  <button
                    key={
                      number
                    }
                    type="button"
                    onClick={() => {
                      setPartySize(
                        number,
                      );

      setDate("");
                      setTime("");
                    }}
                    className={`rounded-xl border py-3 font-medium transition ${
                      partySize ===
                      number
                        ? "border-banana-leaf bg-banana-leaf text-coconut-cream"
                        : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                    }`}
                  >
                    {number}
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-roasted-coffee">
              Date
            </label>

            {loading ? (
              <div className="space-y-3">
                <div className="h-14 animate-pulse rounded-xl bg-tamarind-bark/10" />
                <div className="h-14 animate-pulse rounded-xl bg-tamarind-bark/10" />
              </div>
            ) : dates.length ===
              0 ? (
              <p className="rounded-xl border border-tamarind-bark/10 bg-coconut-cream px-4 py-4 text-sm text-tamarind-bark/70">
                There are currently no
                available reservation
                times for this party
                size.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {dates.map(
                  (
                    option,
                  ) => (
                    <button
                      key={
                        option
                      }
                      type="button"
                      onClick={() => {
                        setDate(
                          option,
                        );

                        setTime(
                          "",
                        );
                      }}
                      className={`rounded-xl border px-4 py-4 text-left transition ${
                        date ===
                        option
                          ? "border-clay-pot bg-clay-pot text-coconut-cream"
                          : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                      }`}
                    >
                      {formatDate(
                        option,
                      )}
                    </button>
                  ),
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setError(null);
      setDate("");
                setTime("");

                setMode(
                  "another-day",
                );
              }}
              className="mt-3 w-full rounded-xl border border-banana-leaf px-4 py-4 font-medium text-banana-leaf transition hover:bg-banana-leaf/5"
            >
              Another day
            </button>
          </div>

          {date && (
            <div>
              <label className="mb-3 block text-sm font-medium text-roasted-coffee">
                Time
              </label>

              {availableTimes.length >
              0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableTimes.map(
                    (
                      option,
                    ) => (
                      <button
                        key={
                          option
                        }
                        type="button"
                        onClick={() =>
                          setTime(
                            option,
                          )
                        }
                        className={`rounded-xl border py-3 font-medium transition ${
                          time ===
                          option
                            ? "border-banana-leaf bg-banana-leaf text-coconut-cream"
                            : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                        }`}
                      >
                        {formatTime(
                          option,
                        )}
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-tamarind-bark/10 bg-coconut-cream px-4 py-4 text-sm text-tamarind-bark/70">
                  No times are
                  available for this
                  date.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-alert/10 px-4 py-3 text-sm text-alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              !date ||
              !time
            }
            className="w-full rounded-full bg-banana-leaf px-6 py-4 font-medium text-coconut-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Confirming..."
              : "Confirm reservation"}
          </button>
        </form>
      </div>
    </main>
  );
}