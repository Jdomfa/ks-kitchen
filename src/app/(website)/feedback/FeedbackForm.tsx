'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { submitFeedback } from './actions';

const EMOJIS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😄' },
  { value: 5, emoji: '🤩' },
];

type CategoryKey = 'food' | 'service' | 'space';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'food', label: 'Food' },
  { key: 'service', label: 'Service' },
  { key: 'space', label: 'Space' },
];

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-roasted-coffee">{label}</p>
      <div className="mt-2 flex justify-between gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => onChange(e.value)}
            aria-label={`${label}: ${e.value} out of 5`}
            className="flex flex-1 items-center justify-center rounded-xl py-2.5 text-2xl transition active:scale-90"
            style={{
              backgroundColor: value === e.value ? 'rgba(193,80,46,0.1)' : 'transparent',
              transform: value === e.value ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {e.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FeedbackForm() {
  const [ratings, setRatings] = useState<Record<CategoryKey, number | null>>({
    food: null,
    service: null,
    space: null,
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allRated = ratings.food && ratings.service && ratings.space;

  function setRating(key: CategoryKey, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRated || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const result = await submitFeedback({
      foodRating: ratings.food!,
      serviceRating: ratings.service!,
      spaceRating: ratings.space!,
      comment,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error ?? 'Something went wrong — please try again.');
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-2xl border border-brushed-brass/15 bg-[#FCF7EF] p-8 text-center shadow-sm"
      >
        <p className="text-4xl">🙏</p>
        <h1 className="mt-4 font-display text-2xl text-roasted-coffee">Thank you!</h1>
        <p className="mt-2 text-sm text-roasted-coffee/60">
          Your feedback means a lot to us at K's Kitchen.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-brushed-brass/15 bg-[#FCF7EF] p-8 shadow-sm"
    >
      <h1 className="text-center font-display text-2xl text-roasted-coffee">
        How was your experience?
      </h1>
      <p className="mt-1 text-center text-sm text-roasted-coffee/60">K's Kitchen Gourmet</p>

      <div className="mt-8 space-y-6">
        {CATEGORIES.map((c) => (
          <RatingRow
            key={c.key}
            label={c.label}
            value={ratings[c.key]}
            onChange={(v) => setRating(c.key, v)}
          />
        ))}
      </div>

      <AnimatePresence>
        {allRated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-6">
              <label className="text-xs font-medium uppercase tracking-wide text-roasted-coffee/50">
                Tell us more <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="What stood out, good or bad?"
                className="mt-1.5 w-full resize-none rounded-xl border border-tamarind-bark/20 bg-white px-4 py-2.5 text-sm text-roasted-coffee outline-none focus:border-brushed-brass"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      <button
        type="submit"
        disabled={!allRated || isSubmitting}
        className="mt-6 w-full rounded-xl bg-clay-pot py-3.5 text-sm font-medium text-coconut-cream transition hover:bg-terracotta disabled:opacity-40"
      >
        {isSubmitting ? 'Sending...' : 'Submit Feedback'}
      </button>
    </form>
  );
}