'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, Users, Check } from 'lucide-react';
import { BrandPattern } from './BrandPattern';
import { siteConfig } from '@/lib/site-config';

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

/** Builds half-hour time slots between two "H:MM AM/PM"-style strings. */
function buildSlots(open: string, close: string) {
  const parse = (t: string) => {
    const [time, mer] = t.split(' ');
    const [h, m] = time.split(':').map(Number);
    let hour = h % 12;
    if (mer === 'PM') hour += 12;
    return hour * 60 + m;
  };
  const fmt = (mins: number) => {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const mer = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${mer}`;
  };
  const slots: string[] = [];
  for (let t = parse(open); t <= parse(close) - 30; t += 30) slots.push(fmt(t));
  return slots;
}

// Slightly earlier last seating than closing time, reused for every day.
const TIME_SLOTS = buildSlots('11:00 AM', '9:30 PM');

type FormState = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
};

const initialForm: FormState = {
  name: '',
  email: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
  notes: '',
};

export function ReservationSection() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.phone || !form.date || !form.time) {
      setError('Please fill in every field so we can confirm your table.');
      return;
    }

    setStatus('submitting');
    // PLACEHOLDER — wire this up to a real reservations endpoint/email/CRM.
    await new Promise((res) => setTimeout(res, 900));
    setStatus('success');
  }

  return (
    <section className="relative overflow-hidden">
      {/* Hero — cream, matches Menu/Store hero treatment */}
      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-14">
        <BrandPattern
          className="text-clay-pot/[0.06]"
          position="bottom-right"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative text-center"
        >
          <p className="flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-brushed-brass mb-3">
            <span className="h-px w-5 bg-brushed-brass/70 inline-block" />
            Book ahead
            <span className="h-px w-5 bg-brushed-brass/70 inline-block" />
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-roasted-coffee">
            Reserve a Table
          </h1>
          <p className="mt-3 font-hand text-2xl text-clay-pot">
            Come hungry, leave full of stories
          </p>
        </motion.div>
      </div>

      {/* Form panel — dark color-blocked ground, same family as the menu section */}
      <div className="relative overflow-hidden bg-banana-leaf">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/brand/patterns/philosophy-pattern.svg')",
          }}
        />
        <div className="absolute inset-0 bg-banana-leaf/55" />

        <div className="relative mx-auto max-w-5xl px-6 py-16 grid md:grid-cols-[1fr_1.4fr] gap-12">
          {/* Left: quick info, mirrors the footer's info columns */}
          <div className="font-sans text-sm text-coconut-cream/70">
            <h2 className="font-display text-xl text-coconut-cream mb-4">
              Good to know
            </h2>
            <ul className="space-y-3">
              {siteConfig.hours.map((h) => (
                <li key={h.days} className="flex items-center gap-2">
                  <Clock
                    className="h-4 w-4 text-brushed-brass shrink-0"
                    strokeWidth={1.8}
                  />
                  {h.days}: {h.time}
                </li>
              ))}
              <li className="flex items-center gap-2">
                <Users
                  className="h-4 w-4 text-brushed-brass shrink-0"
                  strokeWidth={1.8}
                />
                Parties of 9+ — call us directly at{' '}
                {siteConfig.reservationPhone}
              </li>
            </ul>
            <p className="mt-6 italic text-coconut-cream/60">
              We hold tables for 15 minutes past the reserved time. Running
              late? A quick call to {siteConfig.reservationPhone} keeps your
              spot.
            </p>
          </div>

          {/* Right: the form itself */}
          <div className="relative bg-coconut-cream rounded-lg shadow-xl p-6 md:p-8">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center py-10"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-curry-leaf/15 mb-4">
                    <Check
                      className="h-7 w-7 text-curry-leaf"
                      strokeWidth={2.2}
                    />
                  </span>
                  <h3 className="font-display text-2xl text-roasted-coffee mb-2">
                    Table requested
                  </h3>
                  <p className="font-sans text-sm text-roasted-coffee/70 max-w-xs">
                    We&apos;ll confirm by email at{' '}
                    <span className="text-clay-pot">{form.email}</span> shortly.
                    See you {form.date && `on ${form.date}`}
                    {form.time && ` at ${form.time}`}.
                  </p>
                  <button
                    onClick={() => {
                      setForm(initialForm);
                      setStatus('idle');
                    }}
                    className="mt-6 px-6 py-2.5 rounded-full font-sans text-sm border border-roasted-coffee/20 text-roasted-coffee hover:border-clay-pot transition-colors"
                  >
                    Make another reservation
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Full name">
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="Your name"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        placeholder="+234 000 000 0000"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Email">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <Field
                      label="Date"
                      icon={
                        <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
                      }
                    >
                      <input
                        type="date"
                        required
                        min={todayISO}
                        value={form.date}
                        onChange={(e) => update('date', e.target.value)}
                        className={`${inputClass} appearance-none [-webkit-appearance:none]`}
                      />
                    </Field>
                    <Field
                      label="Time"
                      icon={<Clock className="h-4 w-4" strokeWidth={1.8} />}
                    >
                      <select
                        required
                        value={form.time}
                        onChange={(e) => update('time', e.target.value)}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Guests"
                      icon={<Users className="h-4 w-4" strokeWidth={1.8} />}
                    >
                      <select
                        value={form.guests}
                        onChange={(e) =>
                          update('guests', Number(e.target.value))
                        }
                        className={inputClass}
                      >
                        {PARTY_SIZES.map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'guest' : 'guests'}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Notes (optional)">
                    <textarea
                      value={form.notes}
                      onChange={(e) => update('notes', e.target.value)}
                      placeholder="Allergies, special occasions, seating preferences…"
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>

                  {error && (
                    <p className="font-sans text-sm text-clay-pot">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full rounded-full bg-clay-pot text-coconut-cream font-sans text-sm tracking-wide py-3 hover:bg-clay-pot/90 transition-colors disabled:opacity-60"
                  >
                    {status === 'submitting'
                      ? 'Sending…'
                      : 'Confirm Reservation'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  'w-full rounded-md border border-roasted-coffee/20 bg-coconut-cream px-3.5 py-2.5 font-sans text-sm text-roasted-coffee placeholder:text-roasted-coffee/40 focus:outline-none focus:border-clay-pot transition-colors';

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="w-full min-w-0 flex items-center gap-1.5 font-sans text-xs uppercase tracking-wide text-roasted-coffee/60 mb-1.5">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
