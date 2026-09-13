'use client';

import { motion } from 'framer-motion';
import { Clock, Users, MessageCircle, Phone } from 'lucide-react';
import { BrandPattern } from './BrandPattern';
import { siteConfig } from '@/lib/site-config';

// Flip to true once WhatsApp business verification clears and the
// live production number (not the Meta test number) is in place.
const WHATSAPP_LIVE = false;

function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function toWhatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent("Hi, I'd like to book a table")}`;
}

export function ReservationSection() {
  function openChat() {
    window.dispatchEvent(new Event('kk:open-chat'));
  }

  return (
    <section className="relative overflow-hidden">
      {/* HERO */}
      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-14">
        <BrandPattern className="text-clay-pot/[0.06]" position="bottom-right" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative text-center"
        >
          <p className="mb-3 flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-brushed-brass">
            <span className="inline-block h-px w-5 bg-brushed-brass/70" />
            Book ahead
            <span className="inline-block h-px w-5 bg-brushed-brass/70" />
          </p>

          <h1 className="font-display text-4xl text-roasted-coffee md:text-5xl">
            Reserve a Table
          </h1>

          <p className="mt-3 font-hand text-2xl text-clay-pot">
            Come hungry, leave full of stories
          </p>
        </motion.div>
      </div>

      {/* INFO + BOOKING OPTIONS PANEL */}
      <div className="relative overflow-hidden bg-banana-leaf">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/brand/patterns/philosophy-pattern.svg')" }}
        />
        <div className="absolute inset-0 bg-banana-leaf/55" />

        <div className="relative mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-[1fr_1.4fr]">
          {/* LEFT: QUICK INFO */}
          <div className="font-sans text-sm text-coconut-cream/70">
            <h2 className="mb-4 font-display text-xl text-coconut-cream">
              Good to know
            </h2>

            <ul className="space-y-3">
              {siteConfig.hours.map((h) => (
                <li key={h.days} className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-brushed-brass" strokeWidth={1.8} />
                  {h.days}: {h.time}
                </li>
              ))}

              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-brushed-brass" strokeWidth={1.8} />
                Parties of 9+ — call us directly at {siteConfig.reservationPhone}
              </li>
            </ul>

            <p className="mt-6 italic text-coconut-cream/60">
              We hold tables for 15 minutes past the reserved time. Running late? A quick call to{' '}
              {siteConfig.reservationPhone} keeps your spot.
            </p>
          </div>

          {/* RIGHT: BOOKING OPTIONS (replaces the form) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative rounded-lg bg-coconut-cream p-6 shadow-xl md:p-8"
          >
            <h3 className="font-display text-2xl text-roasted-coffee">Book a table</h3>
            <p className="mt-2 font-sans text-sm text-roasted-coffee/70">
              Reservations are handled by our assistant, so availability is checked in
              real time and confirmed right away — no form to submit and wait on.
            </p>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={openChat}
                className="flex w-full items-center justify-between rounded-md border border-clay-pot bg-clay-pot px-5 py-4 text-left text-coconut-cream transition-colors hover:bg-clay-pot/90"
              >
                <span>
                  <span className="block font-sans text-sm font-medium">Chat with us</span>
                  <span className="block font-sans text-xs text-coconut-cream/80">
                    Book instantly, right here on the site
                  </span>
                </span>
                <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              </button>

              {WHATSAPP_LIVE && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(toWhatsAppHref(siteConfig.reservationPhone), '_blank', 'noopener,noreferrer')
                  }
                  className="flex w-full items-center justify-between rounded-md border border-curry-leaf/30 bg-white px-5 py-4 text-left transition-colors hover:border-curry-leaf"
                >
                  <span>
                    <span className="block font-sans text-sm font-medium text-roasted-coffee">
                      Message us on WhatsApp
                    </span>
                    <span className="block font-sans text-xs text-roasted-coffee/60">
                      Same assistant, right inside WhatsApp
                    </span>
                  </span>
                  <MessageCircle className="h-5 w-5 shrink-0 text-curry-leaf" strokeWidth={1.8} />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  window.location.href = toTelHref(siteConfig.reservationPhone);
                }}
                className="flex w-full items-center justify-between rounded-md border border-roasted-coffee/20 bg-white px-5 py-4 text-left transition-colors hover:border-brushed-brass"
              >
                <span>
                  <span className="block font-sans text-sm font-medium text-roasted-coffee">
                    Call the restaurant
                  </span>
                  <span className="block font-sans text-xs text-roasted-coffee/60">
                    Best for large parties (9+) or urgent changes
                  </span>
                </span>
                <Phone className="h-5 w-5 shrink-0 text-brushed-brass" strokeWidth={1.8} />
              </button>
            </div>

            <p className="mt-6 font-sans text-xs text-roasted-coffee/50">
              Allergies, special occasions, or seating preferences? Just mention them in
              chat or on the call — no separate field needed.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}