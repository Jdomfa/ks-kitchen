"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Slot = {
  date: string;
  time: string;
};

type Mode =
  | "booking"
  | "another-day"
  | "success"
  | "another-day-success";

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

export default function ReservationPage() {
  const [
    slots,
    setSlots,
  ] =
    useState<Slot[]>([]);

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
    mode,
    setMode,
  ] =
    useState<Mode>(
      "booking",
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

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
          `/api/foc-reservations?partySize=${partySize}`,
          {
            cache:
              "no-store",
          },
        );

      const data =
        await response.json();

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
        data.slots ?? [],
      );
    } catch (
      error
    ) {
      console.error(
        error,
      );

      setError(
        "Unable to load available reservation times.",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (
      mode ===
      "booking"
    ) {
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
              (slot) =>
                slot.date,
            ),
          ),
        ),
      [slots],
    );


  const availableTimes =
    useMemo(
      () =>
        slots
          .filter(
            (slot) =>
              slot.date ===
              date,
          )
          .map(
            (slot) =>
              slot.time,
          ),
      [
        slots,
        date,
      ],
    );


  async function handleBookingSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (
      !name.trim() ||
      !phone.trim() ||
      !date ||
      !time
    ) {
      setError(
        "Please complete all fields.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          "/api/foc-reservations",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                phone,
                partySize,
                date,
                time,
              }),
          },
        );

      const data =
        await response.json();

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
        "success",
      );
    } catch (
      error
    ) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create reservation.",
      );
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

    if (
      !name.trim()
    ) {
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
          "/api/reservation-interest",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                phone,
              }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
            "Unable to submit request.",
        );
      }

      setMode(
        "another-day-success",
      );
    } catch (
      error
    ) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit request.",
      );
    } finally {
      setSubmitting(false);
    }
  }


  if (
    mode ===
    "success"
  ) {
    return (
      <main className="min-h-screen bg-coconut-cream px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-tamarind-bark/10 bg-surface p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-clay-pot">
            K&apos;s Kitchen
          </p>

          <h1 className="mt-4 text-3xl font-display text-roasted-coffee">
            Reservation confirmed
          </h1>

          <p className="mt-4 text-tamarind-bark">
            Your reservation has
            been confirmed.
          </p>
        </div>
      </main>
    );
  }


  if (
    mode ===
    "another-day-success"
  ) {
    return (
      <main className="min-h-screen bg-coconut-cream px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-tamarind-bark/10 bg-surface p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-clay-pot">
            K&apos;s Kitchen
          </p>

          <h1 className="mt-4 text-3xl font-display text-roasted-coffee">
            We&apos;ve got your details
          </h1>

          <p className="mt-4 text-tamarind-bark">
            Our team can reach out
            regarding another
            reservation day.
          </p>
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

            <h1 className="mt-3 text-4xl font-display text-roasted-coffee">
              Another day
            </h1>

            <p className="mt-3 text-tamarind-bark/70">
              Leave your details and
              we&apos;ll contact you.
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
                value={name}
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Your name"
                className="w-full rounded-xl border border-tamarind-bark/20 bg-coconut-cream px-4 py-3 outline-none focus:border-clay-pot"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-roasted-coffee">
                Phone number
              </label>

              <input
                value={phone}
                onChange={(
                  event,
                ) =>
                  setPhone(
                    event.target.value,
                  )
                }
                placeholder="08012345678"
                inputMode="tel"
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
              className="w-full rounded-full bg-banana-leaf px-6 py-4 font-medium text-coconut-cream disabled:opacity-40"
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
                  "booking",
                );
              }}
              className="w-full rounded-full border border-banana-leaf px-6 py-4 font-medium text-banana-leaf"
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

          <h1 className="mt-3 text-4xl font-display text-roasted-coffee">
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
            handleBookingSubmit
          }
          className="space-y-7 rounded-3xl border border-tamarind-bark/10 bg-surface p-6 shadow-xl md:p-9"
        >

          <div>
            <label className="mb-2 block text-sm font-medium text-roasted-coffee">
              Name
            </label>

            <input
              value={name}
              onChange={(
                event,
              ) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Reservation name"
              className="w-full rounded-xl border border-tamarind-bark/20 bg-coconut-cream px-4 py-3 outline-none focus:border-clay-pot"
            />
          </div>


          <div>
            <label className="mb-2 block text-sm font-medium text-roasted-coffee">
              Phone number
            </label>

            <input
              value={phone}
              onChange={(
                event,
              ) =>
                setPhone(
                  event.target.value,
                )
              }
              placeholder="08012345678"
              inputMode="tel"
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
                    className={`
                      rounded-xl
                      border
                      py-3
                      font-medium
                      ${
                        partySize ===
                        number
                          ? "border-banana-leaf bg-banana-leaf text-coconut-cream"
                          : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                      }
                    `}
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
              <p className="text-sm text-tamarind-bark/60">
                Loading availability...
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
                      className={`
                        rounded-xl
                        border
                        px-4
                        py-4
                        text-left
                        ${
                          date ===
                          option
                            ? "border-clay-pot bg-clay-pot text-coconut-cream"
                            : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                        }
                      `}
                    >
                      {formatDate(
                        option,
                      )}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>


          {date && (
            <div>
              <label className="mb-3 block text-sm font-medium text-roasted-coffee">
                Time
              </label>

              <div className="grid grid-cols-3 gap-3">
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
                      className={`
                        rounded-xl
                        border
                        py-3
                        font-medium
                        ${
                          time ===
                          option
                            ? "border-banana-leaf bg-banana-leaf text-coconut-cream"
                            : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                        }
                      `}
                    >
                      {formatTime(
                        option,
                      )}
                    </button>
                  ),
                )}
              </div>
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
              !date ||
              !time
            }
            className="w-full rounded-full bg-banana-leaf px-6 py-4 font-medium text-coconut-cream transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Confirming..."
              : "Confirm reservation"}
          </button>


          <button
            type="button"
            onClick={() => {
              setError(null);

              setMode(
                "another-day",
              );
            }}
            className="w-full rounded-full border border-banana-leaf px-6 py-4 font-medium text-banana-leaf transition"
          >
            Another day
          </button>

        </form>
      </div>
    </main>
  );
}