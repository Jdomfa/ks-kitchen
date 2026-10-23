"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { submitFeedback } from "./actions";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const RATING_OPTIONS = [
  {
    value: 1,
    label: "Poor",
    emoji: "😞",
  },
  {
    value: 2,
    label: "Fair",
    emoji: "😕",
  },
  {
    value: 3,
    label: "Good",
    emoji: "🙂",
  },
  {
    value: 4,
    label: "Very Good",
    emoji: "😄",
  },
  {
    value: 5,
    label: "Excellent",
    emoji: "🤩",
  },
] as const;

const CATEGORIES = [
  {
    value: "drinks_chilled",
    label: "Drinks Chilled",
  },
  {
    value: "drinks_hot",
    label: "Drinks Hot",
  },
  {
    value: "chati_idli",
    label: "The Chati Idli",
  },
  {
    value: "dosa",
    label: "Dosa",
  },
  {
    value: "uthapam",
    label: "Uthapam",
  },
  {
    value: "dessert",
    label: "Dessert",
  },
] as const;

type FavouriteCategory =
  (typeof CATEGORIES)[number]["value"];

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-brushed-brass/15 bg-white/70 p-4">
      <p className="font-medium text-roasted-coffee">
        {label}
      </p>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {RATING_OPTIONS.map((option) => {
          const selected =
            value === option.value;

          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{
                scale: 0.96,
              }}
              onClick={() =>
                onChange(option.value)
              }
              className={`
                flex min-h-[68px]
                flex-col items-center
                justify-center rounded-xl
                border px-1 py-2
                text-center transition
                ${
                  selected
                    ? "border-clay-pot bg-clay-pot text-coconut-cream"
                    : "border-brushed-brass/15 bg-[#FFFDF9] text-roasted-coffee hover:border-clay-pot/40"
                }
              `}
            >
              <span className="text-xl">
                {option.emoji}
              </span>

              <span className="mt-1 text-xs font-semibold">
                {option.value}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-roasted-coffee/45">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

export function FeedbackForm() {
  const [foodRating, setFoodRating] =
    useState<number | null>(null);

  const [serviceRating, setServiceRating] =
    useState<number | null>(null);

  const [
    favouriteCategory,
    setFavouriteCategory,
  ] = useState<FavouriteCategory | null>(
    null,
  );

  const [feedback, setFeedback] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const canSubmit =
    foodRating !== null &&
    serviceRating !== null &&
    favouriteCategory !== null;

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (
      !foodRating ||
      !serviceRating ||
      !favouriteCategory ||
      isSubmitting
    ) {
      setError(
        "Please answer the first three questions.",
      );

      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await submitFeedback({
      foodRating,
      serviceRating,
      favouriteCategory,
      feedback: feedback.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
      return;
    }

    setError(
      result.error ??
        "Something went wrong — please try again.",
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          ease: EASE_OUT,
        }}
        className="mx-auto max-w-2xl rounded-[28px] border border-brushed-brass/20 bg-[#FCF7EF] px-6 py-12 text-center shadow-sm"
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.6,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.4,
            ease: EASE_OUT,
          }}
          className="text-5xl"
        >
          🙏
        </motion.div>

        <h1 className="mt-5 font-display text-3xl text-roasted-coffee">
          Thank you!
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-roasted-coffee/60">
          Your feedback helps us make
          K&apos;s Kitchen even better.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-brushed-brass/15 bg-[#FCF7EF] shadow-[0_20px_60px_rgba(75,58,46,0.08)]"
    >
      <div className="relative overflow-hidden border-b border-brushed-brass/15 px-6 py-9 text-center sm:px-10">
        <div className="pointer-events-none absolute right-[-20px] top-[-30px] text-[90px] opacity-[0.05]">
          🪷
        </div>

        <h1 className="mt-3 font-display text-3xl text-roasted-coffee sm:text-4xl">
          Tell us what you think
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-roasted-coffee/60">
          Four quick questions.
          Your feedback helps us improve.
        </p>
      </div>

      <div className="space-y-8 p-5 sm:p-8">
        {/* Question 1 */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-clay-pot">
            Question 1
          </p>

          <RatingRow
            label="How will you rate the food?"
            value={foodRating}
            onChange={setFoodRating}
          />
        </section>

        {/* Question 2 */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-clay-pot">
            Question 2
          </p>

          <RatingRow
            label="How will you rate our service?"
            value={serviceRating}
            onChange={setServiceRating}
          />
        </section>

        {/* Question 3 */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-pot">
              Question 3
            </p>

            <h2 className="mt-1 font-display text-xl text-roasted-coffee">
              Favourite Category
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map(
              (category) => {
                const selected =
                  favouriteCategory ===
                  category.value;

                return (
                  <motion.button
                    key={category.value}
                    type="button"
                    whileTap={{
                      scale: 0.97,
                    }}
                    onClick={() =>
                      setFavouriteCategory(
                        category.value,
                      )
                    }
                    className={`
                      rounded-2xl border
                      px-4 py-4
                      text-center transition
                      ${
                        selected
                          ? "border-clay-pot bg-clay-pot text-coconut-cream"
                          : "border-brushed-brass/20 bg-white/70 text-roasted-coffee hover:border-clay-pot/40"
                      }
                    `}
                  >
                    <p className="text-sm font-semibold">
                      {category.label}
                    </p>
                  </motion.button>
                );
              },
            )}
          </div>
        </section>

        {/* Question 4 */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-pot">
            Question 4
          </p>

          <label
            htmlFor="feedback"
            className="mt-1 block font-display text-xl text-roasted-coffee"
          >
            Give us useful feedback
          </label>

          <textarea
            id="feedback"
            value={feedback}
            onChange={(event) =>
              setFeedback(
                event.target.value,
              )
            }
            rows={5}
            placeholder="Tell us what you enjoyed or what we can improve..."
            className="mt-3 w-full resize-none rounded-2xl border border-brushed-brass/20 bg-white/70 px-4 py-3 text-sm text-roasted-coffee outline-none transition placeholder:text-roasted-coffee/30 focus:border-clay-pot/50 focus:ring-2 focus:ring-clay-pot/10"
          />
        </section>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -4,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={
            !canSubmit ||
            isSubmitting
          }
          className="w-full rounded-2xl bg-clay-pot px-6 py-4 text-sm font-semibold text-coconut-cream shadow-sm transition hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? "Sending feedback..."
            : "Submit Feedback"}
        </button>
      </div>
    </motion.form>
  );
}