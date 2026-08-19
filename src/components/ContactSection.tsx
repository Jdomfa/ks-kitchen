'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
import { BrandPattern } from './BrandPattern';

/* lucide-react no longer ships trademarked brand icons (Instagram,
   Facebook, etc.), so these two are small local SVGs instead. */
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
/* Copy & data — swap these placeholders for the real details         */
/* ------------------------------------------------------------------ */

const HEADLINE = 'POUR US A LINE';

const REASONS = [
  { id: 'reservation', label: 'Reservation' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'press', label: 'Press & Events' },
  { id: 'other', label: 'Something else' },
] as const;

type Reason = (typeof REASONS)[number]['id'];

const CONTACT_CARDS = [
  {
    icon: MapPin,
    label: 'Visit Us',
    lines: ['12 Palm Grove Close', 'Wuse II, Abuja'],
    rotate: -3,
  },
  {
    icon: Phone,
    label: 'Call Us',
    lines: ['+234 700 000 0000'],
    rotate: 2,
  },
  {
    icon: Mail,
    label: 'Email Us',
    lines: ['hello@kskitchen.ng'],
    rotate: -2,
  },
  {
    icon: Clock,
    label: 'Hours',
    lines: ['Tue – Sun · 8am – 10pm', 'Closed Mondays'],
    rotate: 3,
  },
] as const;

const MARQUEE_TEXT =
  "COME SAY HI · CHAI'S ALWAYS ON · WE'D LOVE TO HEAR FROM YOU · COME SAY HI · CHAI'S ALWAYS ON · WE'D LOVE TO HEAR FROM YOU ·";

/* ------------------------------------------------------------------ */
/* Small building blocks                                              */
/* ------------------------------------------------------------------ */

/** Headline where each letter drops in with a slight, staggered wobble. */
function KineticHeadline({ text }: { text: string }) {
  const words = text.split(' ');
  let globalIndex = 0;

  return (
    <h1 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase text-coconut-cream leading-[0.95] flex flex-wrap justify-center gap-x-4 gap-y-1">
      {words.map((word, wi) => (
        <span key={wi} className="inline-flex relative">
          {word.split('').map((char, ci) => {
            const i = globalIndex++;
            return (
              <motion.span
                key={ci}
                initial={{ opacity: 0, y: 46, rotate: i % 2 === 0 ? -10 : 10 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.25 + i * 0.045,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            );
          })}
          {/* hand-drawn underline beneath the final word */}
          {wi === words.length - 1 && (
            <svg
              viewBox="0 0 220 20"
              className="absolute -bottom-3 left-0 w-full h-4 text-brushed-brass"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M4 12 C 40 4, 90 18, 130 8 S 190 4, 216 10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 1.1, ease: 'easeOut' }}
              />
            </svg>
          )}
        </span>
      ))}
    </h1>
  );
}

/** A few looping steam wisps — ambient atmosphere for the dark hero. */
function SteamWisps() {
  const wisps = [
    { left: '18%', delay: 0 },
    { left: '50%', delay: 0.9 },
    { left: '82%', delay: 1.6 },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 h-40 overflow-hidden">
      {wisps.map((w, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 40 100"
          className="absolute w-8 h-24 text-coconut-cream/10"
          style={{ left: w.left }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: [-10, -60], opacity: [0, 0.6, 0] }}
          transition={{
            duration: 4.5,
            delay: w.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <path
            d="M20 100 C 5 80, 35 65, 20 50 C 5 35, 35 20, 20 0"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </motion.svg>
      ))}
    </div>
  );
}

/** Pinned "ticket" style info card with a tilt-on-hover interaction. */
function ContactCard({
  icon: Icon,
  label,
  lines,
  rotate,
}: (typeof CONTACT_CARDS)[number]) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: rotate * 1.6 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ rotate: 0, scale: 1.04, y: -4 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative bg-coconut-cream rounded-sm shadow-[0_8px_24px_-8px_rgba(59,34,24,0.35)] px-6 py-7 w-full max-w-[220px]"
    >
      {/* washi-tape accent */}
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-14 bg-brushed-brass/70 rotate-[-4deg]"
        aria-hidden
      />
      <Icon className="h-5 w-5 text-clay-pot" strokeWidth={1.6} />
      <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.2em] text-roasted-coffee/50">
        {label}
      </p>
      <div className="mt-1 font-display text-lg text-roasted-coffee leading-snug">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Main section                                                       */
/* ------------------------------------------------------------------ */

type Status = 'idle' | 'sending' | 'sent';

export function ContactSection() {
  const [reason, setReason] = useState<Reason>('reservation');
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

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
        setForm({ name: '', email: '', message: '' });
      }, 3200);
    }, 1400);
  }

  return (
    <section className="relative overflow-hidden">
      {/* ---------------------------------------------------------- */}
      {/* HERO — dark, loud, kinetic. The one place this page shouts. */}
      {/* ---------------------------------------------------------- */}
      <div className="relative bg-roasted-coffee pt-28 pb-24 md:pt-36 md:pb-32 px-6">
        <BrandPattern
          className="text-coconut-cream/[0.05]"
          position="top-right"
        />
        <SteamWisps />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.3em] text-brushed-brass"
          >
            <span className="h-px w-5 bg-brushed-brass/70 inline-block" />
            Get In Touch
            <span className="h-px w-5 bg-brushed-brass/70 inline-block" />
          </motion.span>

          <div className="mt-6">
            <KineticHeadline text={HEADLINE} />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-10 font-hand text-2xl text-coconut-cream/70 max-w-md mx-auto"
          >
            The kettle&apos;s on, the podi&apos;s fresh — tell us what&apos;s on
            your mind.
          </motion.p>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* INFO CARDS — pinned "menu board" tickets, slightly askew.   */}
      {/* ---------------------------------------------------------- */}
      <div className="relative bg-coconut-cream/40 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 place-items-center">
          {CONTACT_CARDS.map((card) => (
            <ContactCard key={card.label} {...card} />
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* FORM — the signature moment: submit brews like filter coffee */}
      {/* ---------------------------------------------------------- */}
      <div className="relative bg-banana-leaf px-6 py-20 md:py-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: "url('/brand/patterns/philosophy-pattern.svg')",
          }}
        />
        <div className="absolute inset-0 bg-banana-leaf/60" />

        <div className="relative mx-auto max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wide text-coconut-cream">
              Send A Message
            </h2>
            <p className="mt-2 font-sans text-sm text-coconut-cream/60">
              We read every note — most get a reply before the next brew.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* reason pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`px-4 py-1.5 rounded-full font-sans text-xs tracking-wide border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass ${
                    reason === r.id
                      ? 'bg-clay-pot text-coconut-cream border-clay-pot'
                      : 'border-coconut-cream/25 text-coconut-cream/70 hover:border-brushed-brass'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                label="Name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Your name"
              />
              <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="you@example.com"
              />
            </div>

            <FormField
              label="Message"
              as="textarea"
              value={form.message}
              onChange={(v) => setForm((f) => ({ ...f, message: v }))}
              placeholder="What's on your mind?"
            />

            <div className="flex justify-center pt-2">
              <PourButton status={status} disabled={!canSubmit} />
            </div>
          </form>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* MARQUEE + SOCIALS — one last flourish before the footer.    */}
      {/* ---------------------------------------------------------- */}
      <div className="relative bg-clay-pot py-4 overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap font-hand text-2xl text-coconut-cream/90"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          <span className="pr-6">{MARQUEE_TEXT}</span>
          <span className="pr-6">{MARQUEE_TEXT}</span>
        </motion.div>
      </div>

      <div className="relative bg-roasted-coffee px-6 py-10 flex justify-center gap-6">
        {[
          { Icon: InstagramIcon, href: '#', label: 'Instagram' },
          { Icon: FacebookIcon, href: '#', label: 'Facebook' },
        ].map(({ Icon, href, label }) => (
          <motion.a
            key={label}
            href={href}
            aria-label={label}
            whileHover={{ y: -4, rotate: -6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-coconut-cream/20 text-coconut-cream hover:border-brushed-brass hover:text-brushed-brass transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass"
          >
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </motion.a>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Form field — floating label, brand-consistent focus ring            */
/* ------------------------------------------------------------------ */

function FormField({
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
    'w-full bg-transparent border-b border-coconut-cream/25 py-2 font-sans text-sm text-coconut-cream placeholder:text-coconut-cream/35 focus:outline-none focus:border-brushed-brass transition-colors';

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
/* Pour button — the signature interaction. Idle → brewing → sent,     */
/* styled like a davara pour filling a tumbler with filter coffee.     */
/* ------------------------------------------------------------------ */

function PourButton({
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
      className="relative overflow-hidden rounded-full px-9 py-3.5 font-sans text-sm tracking-wide text-coconut-cream border border-brushed-brass/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass"
    >
      {/* fill that rises like poured coffee */}
      <motion.span
        aria-hidden
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-clay-pot to-brushed-brass"
        initial={{ height: '0%' }}
        animate={{
          height:
            status === 'idle' ? '0%' : status === 'sending' ? '100%' : '100%',
        }}
        transition={{
          duration: status === 'sending' ? 1.2 : 0.3,
          ease: 'easeInOut',
        }}
      />
      <span className="relative flex items-center gap-2">
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
              Brewing{' '}
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
              Sent — thondu! ☕
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
