'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Star,
  MessageCircle,
} from 'lucide-react';
import { BrandPattern } from './BrandPattern';

/* lucide-react no longer ships trademarked brand icons, so these two
   are small local SVGs instead. */
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <path d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v7h3v-7h2.2l.8-3H14v-1.5c0-.5.3-1 1-1h2V8Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const REASONS = [
  { id: 'reservation', label: 'Reservation' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'press', label: 'Press & Events' },
  { id: 'other', label: 'Something else' },
] as const;

type Reason = (typeof REASONS)[number]['id'];

const INFO_CARDS = [
  {
    icon: MapPin,
    label: 'Visit Us',
    lines: ['12 Palm Grove Close', 'Wuse II, Abuja'],
  },
  {
    icon: Phone,
    label: 'Call Us',
    lines: ['+234 700 000 0000'],
  },
  {
    icon: Mail,
    label: 'Email Us',
    lines: ['hello@kskitchen.ng'],
  },
  {
    icon: Clock,
    label: 'Working Hours',
    lines: ['Tue – Sun · 8am – 10pm', 'Closed Mondays'],
  },
];

const SOCIAL_CARDS = [
  {
    icon: InstagramIcon,
    title: 'See The Kitchen',
    description: 'Behind-the-scenes shots and daily specials.',
    cta: 'Follow on Instagram',
    href: '#',
  },
  {
    icon: FacebookIcon,
    title: 'Join The Community',
    description: 'Events, announcements, and regulars talking food.',
    cta: 'Follow on Facebook',
    href: '#',
  },
  {
    icon: Star,
    title: 'Leave A Review',
    description: 'Tell other diners what stood out on your visit.',
    cta: 'Review Us',
    href: '#',
  },
  {
    icon: MessageCircle,
    title: 'Chat With Us',
    description: 'Quick questions? Message us directly.',
    cta: 'Open WhatsApp',
    href: '#',
  },
];

/**
 * PLACEHOLDER TESTIMONIALS — replace every quote/name/role below with real
 * customer feedback before this goes live. Nothing here is a real review;
 * it's scaffolding so the layout can be built and previewed.
 */
const TESTIMONIALS = [
  {
    quote:
      '[Add a real customer quote here — what did they order, what stood out?]',
    name: 'Customer Name',
    role: 'Add context — e.g. "Regular", "First-time visitor"',
    featured: true,
  },
  {
    quote: '[Add a real customer quote here.]',
    name: 'Customer Name',
    role: 'Add context',
  },
  {
    quote: '[Add a real customer quote here.]',
    name: 'Customer Name',
    role: 'Add context',
  },
  {
    quote: '[Add a real customer quote here.]',
    name: 'Customer Name',
    role: 'Add context',
  },
];

const FAQ_TABS = ['General', 'Reservations', 'Catering'] as const;
type FaqTab = (typeof FAQ_TABS)[number];

/**
 * Example FAQ content — verify accuracy (hours, policies, catering
 * minimums, etc.) against the restaurant's actual policies before launch.
 */
const FAQS: Record<FaqTab, { q: string; a: string }[]> = {
  General: [
    {
      q: 'What are your opening hours?',
      a: "We're open Tuesday through Sunday, 8am to 10pm. Closed on Mondays.",
    },
    {
      q: 'Do you have vegetarian and vegan options?',
      a: 'Most of our dosa, uthappam, and spice mix items are vegetarian, and many are vegan — look for the dietary tags on each menu item.',
    },
    {
      q: 'Is there parking available?',
      a: 'Yes, there is parking available directly outside the restaurant.',
    },
  ],
  Reservations: [
    {
      q: 'Do I need a reservation?',
      a: 'Walk-ins are welcome, but we recommend booking ahead for weekends and parties of five or more.',
    },
    {
      q: 'Can I request a specific table?',
      a: "Let us know in the message field when you book, and we'll do our best to accommodate it.",
    },
    {
      q: "What's your cancellation policy?",
      a: 'We ask for at least two hours notice for cancellations so we can offer the table to someone else.',
    },
  ],
  Catering: [
    {
      q: 'Do you cater events?',
      a: 'Yes — reach out through the form with your event size and date, and our team will put together a menu.',
    },
    {
      q: 'Is there a minimum order size for catering?',
      a: 'Catering orders typically start at 15 guests. Smaller group orders may be possible — just ask.',
    },
    {
      q: 'How far in advance should I book catering?',
      a: "We recommend at least one week's notice for catering orders, longer for larger events.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Main section                                                       */
/* ------------------------------------------------------------------ */

type Status = 'idle' | 'sending' | 'sent';

export function ContactSection() {
  const [reason, setReason] = useState<Reason>('reservation');
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const canSubmit = useMemo(
    () =>
      form.name.trim() &&
      form.email.trim() &&
      form.message.trim() &&
      status !== 'sending',
    [form, status],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    // TODO: replace with a real submission (API route, Formspree, Resend, etc.)
    window.setTimeout(() => {
      setStatus('sent');
      window.setTimeout(() => {
        setStatus('idle');
        setForm({ name: '', email: '', phone: '', message: '' });
      }, 3200);
    }, 1400);
  }

  return (
    <section className="relative overflow-hidden bg-coconut-cream">
      {/* ---------------------------------------------------------- */}
      {/* INTRO + TWO-COLUMN: info cards on the left, form on the right */}
      {/* ---------------------------------------------------------- */}
      <div className="relative px-6 pt-20 pb-16">
        <BrandPattern className="text-clay-pot/[0.05]" position="top-right" />

        <div className="relative mx-auto max-w-5xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="block font-sans text-[11px] uppercase tracking-[0.3em] text-brushed-brass mb-3"
          >
            Contact Us
          </motion.span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left: heading, copy, info cards */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="font-display text-4xl md:text-5xl leading-tight"
              >
                <span className="text-clay-pot">Get In Touch</span>
                <br />
                <span className="text-roasted-coffee">With The Kitchen</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-4 font-hand text-xl text-clay-pot/75 max-w-sm"
              >
                Fill out the form and someone from the kitchen will get back to
                you within a day or two.
              </motion.p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {INFO_CARDS.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                    className="rounded-xl border border-roasted-coffee/10 bg-white/50 p-4"
                  >
                    <card.icon
                      className="h-5 w-5 text-clay-pot"
                      strokeWidth={1.6}
                    />
                    <p className="mt-2 font-sans text-sm font-semibold text-roasted-coffee">
                      {card.label}
                    </p>
                    {card.lines.map((line) => (
                      <p
                        key={line}
                        className="font-sans text-sm text-roasted-coffee/60"
                      >
                        {line}
                      </p>
                    ))}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: contained form card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-2xl border border-roasted-coffee/10 bg-white/60 p-6 md:p-8 h-fit"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReason(r.id)}
                      className={`px-3.5 py-1.5 rounded-full font-sans text-xs tracking-wide border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass ${
                        reason === r.id
                          ? 'bg-clay-pot text-coconut-cream border-clay-pot'
                          : 'border-roasted-coffee/20 text-roasted-coffee/70 hover:border-clay-pot'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field
                    label="Full Name"
                    value={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    placeholder="Your name"
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    placeholder="you@example.com"
                  />
                </div>

                <Field
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  placeholder="+234..."
                />

                <Field
                  label="Message"
                  as="textarea"
                  value={form.message}
                  onChange={(v) => setForm((f) => ({ ...f, message: v }))}
                  placeholder="What's on your mind?"
                />

                <SubmitButton status={status} disabled={!canSubmit} />
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* TESTIMONIALS — placeholders, swap for real quotes            */}
      {/* ---------------------------------------------------------- */}
      <div className="relative bg-banana-leaf px-6 py-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: "url('/brand/patterns/philosophy-pattern.svg')",
          }}
        />
        <div className="absolute inset-0 bg-banana-leaf/60" />

        <div className="relative mx-auto max-w-4xl text-center mb-12">
          <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-brushed-brass">
            Testimonials
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-coconut-cream">
            Loved By Regulars & First-Timers Alike
          </h2>
        </div>

        <div className="relative mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`rounded-xl p-6 ${
                t.featured
                  ? 'bg-roasted-coffee text-coconut-cream md:row-span-2'
                  : 'bg-coconut-cream text-roasted-coffee'
              }`}
            >
              <p className="font-sans text-sm leading-relaxed opacity-80">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 font-sans text-sm font-semibold">{t.name}</p>
              <p
                className={`font-sans text-xs ${
                  t.featured
                    ? 'text-coconut-cream/50'
                    : 'text-roasted-coffee/50'
                }`}
              >
                {t.role}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* SOCIAL / COMMUNITY ROW                                       */}
      {/* ---------------------------------------------------------- */}
      <div className="relative bg-coconut-cream px-6 py-16">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-6">
          {SOCIAL_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="text-center"
            >
              <card.icon
                className="mx-auto h-6 w-6 text-roasted-coffee"
                strokeWidth={1.6}
              />
              <p className="mt-3 font-display text-base text-roasted-coffee">
                {card.title}
              </p>
              <p className="mt-1 font-sans text-xs text-roasted-coffee/55">
                {card.description}
              </p>
              <Link
                href={card.href}
                className="mt-3 inline-block rounded-full border border-roasted-coffee/20 px-4 py-1.5 font-sans text-xs text-roasted-coffee hover:border-clay-pot hover:text-clay-pot transition-colors"
              >
                {card.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* FAQ — tabbed accordion                                       */}
      {/* ---------------------------------------------------------- */}
      <FaqSection />

      {/* ---------------------------------------------------------- */}
      {/* CLOSING CTA BAND                                             */}
      {/* ---------------------------------------------------------- */}
      <div className="relative bg-gradient-to-br from-roasted-coffee to-tamarind-bark px-6 py-20 overflow-hidden">
        <BrandPattern
          className="text-coconut-cream/[0.05]"
          position="bottom-left"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl md:text-4xl text-coconut-cream">
            Hungry Yet?
          </h2>
          <p className="mt-3 font-sans text-sm text-coconut-cream/60 max-w-md mx-auto">
            Come taste it yourself — walk in, or book a table ahead for the
            weekend rush.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/menu"
              className="rounded-full bg-clay-pot px-7 py-3 font-sans text-sm uppercase tracking-wide text-coconut-cream hover:bg-terracotta transition-colors"
            >
              View Menu
            </Link>
            <Link
              href="/reservation"
              className="rounded-full border border-coconut-cream/30 px-7 py-3 font-sans text-sm uppercase tracking-wide text-coconut-cream hover:border-brushed-brass hover:text-brushed-brass transition-colors"
            >
              Book A Table
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordion with tabs                                             */
/* ------------------------------------------------------------------ */

function FaqSection() {
  const [activeTab, setActiveTab] = useState<FaqTab>('General');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function selectTab(tab: FaqTab) {
    setActiveTab(tab);
    setOpenIndex(0);
  }

  return (
    <div className="relative bg-coconut-cream px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
          <div>
            <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-brushed-brass">
              FAQs
            </span>
            <h2 className="mt-2 font-display text-3xl md:text-4xl text-roasted-coffee">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="flex gap-2">
            {FAQ_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
                className={`px-4 py-1.5 rounded-full font-sans text-xs tracking-wide border transition-colors ${
                  activeTab === tab
                    ? 'bg-clay-pot text-coconut-cream border-clay-pot'
                    : 'border-roasted-coffee/20 text-roasted-coffee/70 hover:border-clay-pot'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {FAQS[activeTab].map((item, i) => {
            const open = openIndex === i;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-roasted-coffee/10 bg-white/50 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-sans text-sm text-roasted-coffee"
                >
                  {item.q}
                  <ChevronDown
                    className={`h-4 w-4 text-roasted-coffee/50 transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 font-sans text-sm text-roasted-coffee/60">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form field                                                          */
/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  as = 'input',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  as?: 'input' | 'textarea';
}) {
  const shared =
    'w-full bg-white/70 border border-roasted-coffee/15 rounded-md px-3 py-2.5 font-sans text-sm text-roasted-coffee placeholder:text-roasted-coffee/35 focus:outline-none focus:border-clay-pot transition-colors';

  return (
    <label className="block text-left">
      <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-brushed-brass/80">
        {label}
      </span>
      {as === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${shared} mt-1 resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${shared} mt-1`}
        />
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Submit button — simple, clean state transitions                     */
/* ------------------------------------------------------------------ */

function SubmitButton({
  status,
  disabled,
}: {
  status: Status;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-clay-pot py-3 font-sans text-sm uppercase tracking-wide text-coconut-cream transition-colors hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-50"
    >
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            Send Message <Send className="h-4 w-4" strokeWidth={1.8} />
          </motion.span>
        )}
        {status === 'sending' && (
          <motion.span
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            Sending{' '}
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
          </motion.span>
        )}
        {status === 'sent' && (
          <motion.span
            key="sent"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            Message Sent <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
