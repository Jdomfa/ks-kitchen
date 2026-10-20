"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type FocSlot = {
  date: string;
  time: string;
};

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday:
        "long",
      day:
        "numeric",
      month:
        "long",
      timeZone:
        "UTC",
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

export default function FocReservationPage() {
  const [
    slots,
    setSlots,
  ] =
    useState<FocSlot[]>(
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
    success,
    setSuccess,
  ] =
    useState(false);

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
    setLoading(
      true,
    );

    setError(
      null,
    );

    try {
      const response =
        await fetch(
          "/api/foc-reservations",
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
        data.slots ??
          [],
      );
    } catch (err) {
      console.error(
        err,
      );

      setError(
        "Unable to load FOC reservation times.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  useEffect(() => {
    void loadSlots();
  }, []);

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

  useEffect(() => {
    if (
      date &&
      !dates.includes(
        date,
      )
    ) {
      setDate("");
      setTime("");
    }
  }, [
    dates,
    date,
  ]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(
      null,
    );

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

    setSubmitting(
      true,
    );

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

      setSuccess(
        true,
      );

      await loadSlots();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create reservation.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  if (success) {
    return (
      <main
        className="
          min-h-screen
          bg-coconut-cream
          px-5
          py-16
        "
      >
        <div
          className="
            mx-auto
            max-w-xl
            rounded-3xl
            border
            border-tamarind-bark/10
            bg-surface
            p-8
            text-center
            shadow-xl
          "
        >
          <p
            className="
              text-sm
              uppercase
              tracking-[0.24em]
              text-clay-pot
            "
          >
            K&apos;s Kitchen
          </p>

          <h1
            className="
              mt-4
              text-3xl
              font-display
              text-roasted-coffee
            "
          >
            Reservation confirmed
          </h1>

          <p
            className="
              mt-4
              text-tamarind-bark
            "
          >
            Your FOC reservation
            has been confirmed.
          </p>

          <button
            type="button"
            onClick={() => {
              setSuccess(
                false,
              );

              setName("");
              setPhone("");
              setDate("");
              setTime("");
              setPartySize(
                2,
              );
            }}
            className="
              mt-7
              rounded-full
              bg-banana-leaf
              px-7
              py-3
              font-medium
              text-coconut-cream
            "
          >
            Make another reservation
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-coconut-cream
        px-5
        py-12
        md:py-20
      "
    >
      <div
        className="
          mx-auto
          max-w-2xl
        "
      >
        <div
          className="
            mb-8
            text-center
          "
        >
          <p
            className="
              text-sm
              font-medium
              uppercase
              tracking-[0.25em]
              text-clay-pot
            "
          >
            K&apos;s Kitchen
          </p>

          <h1
            className="
              mt-3
              text-4xl
              font-display
              text-roasted-coffee
            "
          >
            FOC Reservation
          </h1>

          <p
            className="
              mt-3
              text-tamarind-bark/70
            "
          >
            Select one of the
            available Wednesday or
            Thursday reservation
            times.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="
            space-y-7
            rounded-3xl
            border
            border-tamarind-bark/10
            bg-surface
            p-6
            shadow-xl
            md:p-9
          "
        >
          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-medium
                text-roasted-coffee
              "
            >
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
              className="
                w-full
                rounded-xl
                border
                border-tamarind-bark/20
                bg-coconut-cream
                px-4
                py-3
                outline-none
                focus:border-clay-pot
              "
            />
          </div>

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-medium
                text-roasted-coffee
              "
            >
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
              placeholder="+234..."
              inputMode="tel"
              className="
                w-full
                rounded-xl
                border
                border-tamarind-bark/20
                bg-coconut-cream
                px-4
                py-3
                outline-none
                focus:border-clay-pot
              "
            />
          </div>

          <div>
            <label
              className="
                mb-3
                block
                text-sm
                font-medium
                text-roasted-coffee
              "
            >
              Number of guests
            </label>

            <div
              className="
                grid
                grid-cols-4
                gap-2
              "
            >
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
                    onClick={() =>
                      setPartySize(
                        number,
                      )
                    }
                    className={`
                      rounded-xl
                      border
                      py-3
                      font-medium
                      transition
                      ${
                        partySize ===
                        number
                          ? "border-banana-leaf bg-banana-leaf text-coconut-cream"
                          : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                      }
                    `}
                  >
                    {
                      number
                    }
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <label
              className="
                mb-3
                block
                text-sm
                font-medium
                text-roasted-coffee
              "
            >
              Date
            </label>

            {loading ? (
              <p>
                Loading dates...
              </p>
            ) : (
              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
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
                        transition
                        ${
                          date ===
                          option
                            ? "border-clay-pot bg-clay-pot text-coconut-cream"
                            : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                        }
                      `}
                    >
                      {
                        formatDate(
                          option,
                        )
                      }
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {date && (
            <div>
              <label
                className="
                  mb-3
                  block
                  text-sm
                  font-medium
                  text-roasted-coffee
                "
              >
                Time
              </label>

              <div
                className="
                  grid
                  grid-cols-3
                  gap-3
                "
              >
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
                        transition
                        ${
                          time ===
                          option
                            ? "border-banana-leaf bg-banana-leaf text-coconut-cream"
                            : "border-tamarind-bark/20 bg-coconut-cream text-roasted-coffee"
                        }
                      `}
                    >
                      {
                        formatTime(
                          option,
                        )
                      }
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {error && (
            <div
              className="
                rounded-xl
                bg-alert/10
                px-4
                py-3
                text-sm
                text-alert
              "
            >
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
            className="
              w-full
              rounded-full
              bg-banana-leaf
              px-6
              py-4
              font-medium
              text-coconut-cream
              transition
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {submitting
              ? "Confirming..."
              : "Confirm FOC Reservation"}
          </button>
        </form>
      </div>
    </main>
  );
}