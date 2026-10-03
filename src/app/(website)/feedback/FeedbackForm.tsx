'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { submitFeedback } from './actions';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const RATING_OPTIONS = [
  { value: 1, label: 'Poor', emoji: '😞' },
  { value: 2, label: 'Fair', emoji: '😕' },
  { value: 3, label: 'Good', emoji: '🙂' },
  { value: 4, label: 'Very Good', emoji: '😄' },
  { value: 5, label: 'Excellent', emoji: '🤩' },
] as const;

type RatingKey =
  | 'foodQuality'
  | 'menuVariety'
  | 'serviceSpeed'
  | 'staffFriendliness'
  | 'cleanlinessAtmosphere'
  | 'valueForMoney';

const RATING_CATEGORIES: {
  key: RatingKey;
  label: string;
  icon: string;
}[] = [
  {
    key: 'foodQuality',
    label: 'Food Quality & Taste',
    icon: '🍽️',
  },
  {
    key: 'menuVariety',
    label: 'Menu Variety & Options',
    icon: '📖',
  },
  {
    key: 'serviceSpeed',
    label: 'Service Speed & Attentiveness',
    icon: '⏱️',
  },
  {
    key: 'staffFriendliness',
    label: 'Staff Friendliness & Knowledge',
    icon: '🤝',
  },
  {
    key: 'cleanlinessAtmosphere',
    label: 'Cleanliness & Atmosphere',
    icon: '✨',
  },
  {
    key: 'valueForMoney',
    label: 'Value for Money',
    icon: '💰',
  },
];

type Recommendation =
  | 'definitely'
  | 'probably'
  | 'unlikely'
  | 'no';

const RECOMMENDATIONS: {
  value: Recommendation;
  label: string;
}[] = [
  {
    value: 'definitely',
    label: 'Definitely',
  },
  {
    value: 'probably',
    label: 'Probably',
  },
  {
    value: 'unlikely',
    label: 'Unlikely',
  },
  {
    value: 'no',
    label: 'No',
  },
];

function RatingRow({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-brushed-brass/15 bg-white/70 p-4">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>

        <p className="font-medium text-roasted-coffee">
          {label}
        </p>
      </div>

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
                flex min-h-[68px] flex-col
                items-center justify-center
                rounded-xl border px-1 py-2
                text-center transition
                ${
                  selected
                    ? 'border-clay-pot bg-clay-pot text-coconut-cream'
                    : 'border-brushed-brass/15 bg-[#FFFDF9] text-roasted-coffee hover:border-clay-pot/40'
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
  const [ratings, setRatings] = useState<
    Record<RatingKey, number | null>
  >({
    foodQuality: null,
    menuVariety: null,
    serviceSpeed: null,
    staffFriendliness: null,
    cleanlinessAtmosphere: null,
    valueForMoney: null,
  });

  const [dishesOrdered, setDishesOrdered] =
    useState('');

  const [standoutFeedback, setStandoutFeedback] =
    useState('');

  const [recommendation, setRecommendation] =
    useState<Recommendation | null>(null);

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [mayContact, setMayContact] =
    useState<boolean | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const allRated =
    Object.values(ratings).every(
      (rating) => rating !== null
    );

  function setRating(
    key: RatingKey,
    value: number
  ) {
    setRatings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !allRated ||
      !recommendation ||
      isSubmitting
    ) {
      setError(
        'Please complete all ratings and select a recommendation option.'
      );

      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result =
      await submitFeedback({
        foodQuality:
          ratings.foodQuality!,

        menuVariety:
          ratings.menuVariety!,

        serviceSpeed:
          ratings.serviceSpeed!,

        staffFriendliness:
          ratings.staffFriendliness!,

        cleanlinessAtmosphere:
          ratings.cleanlinessAtmosphere!,

        valueForMoney:
          ratings.valueForMoney!,

        dishesOrdered:
          dishesOrdered.trim(),

        standoutFeedback:
          standoutFeedback.trim(),

        recommendation,

        name:
          name.trim(),

        email:
          email.trim(),

        phone:
          phone.trim(),

        mayContact,
      });

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(
        result.error ??
          'Something went wrong — please try again.'
      );
    }
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
          Thank you for your feedback
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-roasted-coffee/60">
          Your feedback helps us improve every
          part of the K&apos;s Kitchen
          experience.
        </p>

        <div className="mx-auto mt-7 h-px w-20 bg-brushed-brass/40" />

        <p className="mt-6 text-sm text-roasted-coffee/55">
          We look forward to welcoming you
          again soon.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-brushed-brass/15 bg-[#FCF7EF] shadow-[0_20px_60px_rgba(75,58,46,0.08)]"
    >
      {/* Hero */}

      <div className="relative overflow-hidden border-b border-brushed-brass/15 px-6 py-9 text-center sm:px-10">
        <div className="pointer-events-none absolute left-[-35px] top-[-40px] text-[100px] opacity-[0.04]">
          ✦
        </div>

        <div className="pointer-events-none absolute right-[-20px] top-[-30px] text-[90px] opacity-[0.05]">
          🪷
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay-pot">
          K&apos;s Kitchen Gourmet
        </p>

        <h1 className="mt-3 font-display text-3xl text-roasted-coffee sm:text-4xl">
          We&apos;d love your feedback
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-roasted-coffee/60">
          Tell us about your visit. Your
          feedback helps us make every meal,
          moment and experience even better.
        </p>
      </div>

      <div className="space-y-10 p-5 sm:p-8">
        {/* Section 2 */}

        <section>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-pot">
              Section 1
            </p>

            <h2 className="mt-1 font-display text-2xl text-roasted-coffee">
              Dining Experience
            </h2>

            <p className="mt-2 text-sm text-roasted-coffee/55">
              Rate each area from 1 = Poor to 5
              = Excellent.
            </p>
          </div>

          <div className="space-y-3">
            {RATING_CATEGORIES.map(
              (category) => (
                <RatingRow
                  key={category.key}
                  label={category.label}
                  icon={category.icon}
                  value={
                    ratings[
                      category.key
                    ]
                  }
                  onChange={(value) =>
                    setRating(
                      category.key,
                      value
                    )
                  }
                />
              )
            )}
          </div>
        </section>

        <div className="h-px bg-brushed-brass/15" />

        {/* Detailed feedback */}

        <section>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-pot">
              Section 2
            </p>

            <h2 className="mt-1 font-display text-2xl text-roasted-coffee">
              Tell us more
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="dishes"
                className="text-sm font-medium text-roasted-coffee"
              >
                Which dishes or drinks did you
                order today?
              </label>

              <textarea
                id="dishes"
                value={dishesOrdered}
                onChange={(event) =>
                  setDishesOrdered(
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Tell us what you ordered..."
                className="mt-2 w-full resize-none rounded-2xl border border-brushed-brass/20 bg-white/70 px-4 py-3 text-sm text-roasted-coffee outline-none transition placeholder:text-roasted-coffee/30 focus:border-clay-pot/50 focus:ring-2 focus:ring-clay-pot/10"
              />
            </div>

            <div>
              <label
                htmlFor="standout"
                className="text-sm font-medium text-roasted-coffee"
              >
                Did anything stand out during
                your visit?
              </label>

              <p className="mt-1 text-xs text-roasted-coffee/45">
                Positive or negative — we value
                both.
              </p>

              <textarea
                id="standout"
                value={standoutFeedback}
                onChange={(event) =>
                  setStandoutFeedback(
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Share your thoughts, highlights or suggestions..."
                className="mt-2 w-full resize-none rounded-2xl border border-brushed-brass/20 bg-white/70 px-4 py-3 text-sm text-roasted-coffee outline-none transition placeholder:text-roasted-coffee/30 focus:border-clay-pot/50 focus:ring-2 focus:ring-clay-pot/10"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-roasted-coffee">
                Would you recommend us to a
                friend or colleague?
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RECOMMENDATIONS.map(
                  (option) => {
                    const selected =
                      recommendation ===
                      option.value;

                    return (
                      <motion.button
                        key={
                          option.value
                        }
                        type="button"
                        whileTap={{
                          scale: 0.97,
                        }}
                        onClick={() =>
                          setRecommendation(
                            option.value
                          )
                        }
                        className={`
                          rounded-xl border px-3 py-3
                          text-sm font-medium transition
                          ${
                            selected
                              ? 'border-clay-pot bg-clay-pot text-coconut-cream'
                              : 'border-brushed-brass/20 bg-white/70 text-roasted-coffee hover:border-clay-pot/40'
                          }
                        `}
                      >
                        {option.label}
                      </motion.button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-brushed-brass/15" />

        {/* Stay connected */}

        <section>
          <div className="mb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-pot">
                  Section 3
                </p>

                <h2 className="mt-1 font-display text-2xl text-roasted-coffee">
                  Stay Connected
                </h2>
              </div>

              <span className="rounded-full bg-brushed-brass/10 px-3 py-1 text-xs text-roasted-coffee/55">
                Optional
              </span>
            </div>

            <p className="mt-2 max-w-xl text-sm leading-6 text-roasted-coffee/55">
              Leave your details if you&apos;d
              like to join our VIP rewards
              program or receive a response to
              your feedback.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-roasted-coffee/70">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Your name"
                className="mt-1.5 w-full rounded-xl border border-brushed-brass/20 bg-white/70 px-4 py-3 text-sm text-roasted-coffee outline-none transition placeholder:text-roasted-coffee/30 focus:border-clay-pot/50 focus:ring-2 focus:ring-clay-pot/10"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-roasted-coffee/70">
                Phone number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="080..."
                className="mt-1.5 w-full rounded-xl border border-brushed-brass/20 bg-white/70 px-4 py-3 text-sm text-roasted-coffee outline-none transition placeholder:text-roasted-coffee/30 focus:border-clay-pot/50 focus:ring-2 focus:ring-clay-pot/10"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-roasted-coffee/70">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-brushed-brass/20 bg-white/70 px-4 py-3 text-sm text-roasted-coffee outline-none transition placeholder:text-roasted-coffee/30 focus:border-clay-pot/50 focus:ring-2 focus:ring-clay-pot/10"
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-roasted-coffee">
              May we contact you regarding your
              experience?
            </p>

            <div className="mt-3 flex gap-2">
              {[true, false].map(
                (option) => {
                  const selected =
                    mayContact ===
                    option;

                  return (
                    <button
                      key={
                        option
                          ? 'yes'
                          : 'no'
                      }
                      type="button"
                      onClick={() =>
                        setMayContact(
                          option
                        )
                      }
                      className={`
                        min-w-[100px] rounded-xl
                        border px-4 py-3 text-sm
                        font-medium transition
                        ${
                          selected
                            ? 'border-clay-pot bg-clay-pot text-coconut-cream'
                            : 'border-brushed-brass/20 bg-white/70 text-roasted-coffee'
                        }
                      `}
                    >
                      {option
                        ? 'Yes'
                        : 'No'}
                    </button>
                  );
                }
              )}
            </div>
          </div>
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
            !allRated ||
            !recommendation ||
            isSubmitting
          }
          className="w-full rounded-2xl bg-clay-pot px-6 py-4 text-sm font-semibold text-coconut-cream shadow-sm transition hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? 'Sending feedback...'
            : 'Submit Feedback'}
        </button>

        <p className="text-center text-xs leading-5 text-roasted-coffee/40">
          Thank you for helping us make
          K&apos;s Kitchen Gourmet even better.
        </p>
      </div>
    </motion.form>
  );
}