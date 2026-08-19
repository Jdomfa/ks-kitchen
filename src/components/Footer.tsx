'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Tag, Clock, ChevronUp, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/site-config';

/* ---- Small brand icons (lucide dropped these; kept minimal/monoline) ---- */

function FacebookIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.196 2.238.196v2.475h-1.26c-1.243 0-1.63.775-1.63 1.57v1.89h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.5 2h-3v13.6c0 1.5-1.2 2.7-2.7 2.7a2.7 2.7 0 0 1-2.7-2.7 2.7 2.7 0 0 1 2.7-2.7c.28 0 .55.04.8.12v-3.05a5.8 5.8 0 0 0-.8-.05A5.7 5.7 0 0 0 5.1 15.6a5.7 5.7 0 0 0 5.7 5.7 5.7 5.7 0 0 0 5.7-5.7V8.42a8.1 8.1 0 0 0 4.5 1.37V6.8a5.1 5.1 0 0 1-4.5-4.8Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.44 5.14L2 22l5.11-1.53a9.85 9.85 0 0 0 4.93 1.33h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.06h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.03.91.91-2.95-.2-.31a8.14 8.14 0 0 1-1.25-4.38c0-4.5 3.66-8.16 8.16-8.16 2.18 0 4.22.85 5.76 2.39a8.1 8.1 0 0 1 2.39 5.77c0 4.5-3.67 8.05-8.26 8.05Zm4.48-6.04c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.47-.01-.16 0-.42.06-.65.3-.22.24-.85.84-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.15.2-.57.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

const SOCIALS = [
  { href: siteConfig.social.facebook, Icon: FacebookIcon, label: 'Facebook' },
  { href: siteConfig.social.twitter, Icon: XIcon, label: 'X' },
  {
    href: siteConfig.social.instagram,
    Icon: InstagramIcon,
    label: 'Instagram',
  },
  { href: siteConfig.social.tiktok, Icon: TikTokIcon, label: 'TikTok' },
  { href: siteConfig.social.whatsapp, Icon: WhatsAppIcon, label: 'WhatsApp' },
];

/**
 * Torn/scalloped divider between the section above and the footer —
 * a row of rounded scallops in the *previous* section's color, sitting
 * right at the top of the footer so it reads as a paper edge rather
 * than a flat color-to-color seam.
 */
function TornEdge({ color = 'fill-banana-leaf' }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 600 24"
      preserveAspectRatio="none"
      className={`block w-full h-4 md:h-6 ${color}`}
      aria-hidden="true"
    >
      <path d="M0 0H600V10C585 18 570 2 555 10C540 18 525 2 510 10C495 18 480 2 465 10C450 18 435 2 420 10C405 18 390 2 375 10C360 18 345 2 330 10C315 18 300 2 285 10C270 18 255 2 240 10C225 18 210 2 195 10C180 18 165 2 150 10C135 18 120 2 105 10C90 18 75 2 60 10C45 18 30 2 15 10C7 14 3 12 0 10V0Z" />
    </svg>
  );
}

/** Floating back-to-top button — appears once the page has scrolled a bit. */
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-roasted-coffee text-coconut-cream shadow-lg hover:bg-clay-pot transition-colors"
        >
          <ChevronUp className="h-5 w-5" strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function Footer() {
  return (
    <>
      <footer className="bg-tamarind-bark text-coconut-cream mt-auto">
        <TornEdge color="fill-banana-leaf" />
        <div className="mx-auto max-w-6xl px-6 pt-14 pb-10">
          {/* Logo + CTAs */}
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 pb-12 border-b border-coconut-cream/10">
            <Image
              src="/brand/main_logo.svg"
              alt="K's Kitchen"
              width={120}
              height={92}
              className="h-16 w-auto invert opacity-90"
            />
            <div className="flex gap-4">
              <Link
                href="/menu"
                className="px-6 py-2.5 rounded-full font-sans text-sm tracking-wide border border-coconut-cream/30 text-coconut-cream hover:border-coconut-cream transition-colors"
              >
                View Menu
              </Link>
              <Link
                href="/reservation"
                className="px-6 py-2.5 rounded-full font-sans text-sm tracking-wide bg-clay-pot text-coconut-cream hover:bg-clay-pot/90 transition-colors"
              >
                Reserve a Table
              </Link>
            </div>
          </div>

          {/* Info columns */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 py-12">
            <div className="font-sans text-sm">
              <h3 className="flex items-center gap-2 font-display text-base mb-3 text-coconut-cream">
                <MapPin
                  className="h-4 w-4 text-brushed-brass"
                  strokeWidth={1.8}
                />
                Address
              </h3>
              <p className="text-coconut-cream/70 leading-relaxed">
                {siteConfig.address.line1}
                <br />
                {siteConfig.address.line2}
              </p>
            </div>

            <div className="font-sans text-sm">
              <h3 className="flex items-center gap-2 font-display text-base mb-3 text-coconut-cream">
                <Tag className="h-4 w-4 text-brushed-brass" strokeWidth={1.8} />
                Reservations
              </h3>
              <p className="text-coconut-cream/70 leading-relaxed">
                {siteConfig.reservationPhone}
                <br />
                {siteConfig.reservationEmail}
              </p>
            </div>

            <div className="font-sans text-sm">
              <h3 className="flex items-center gap-2 font-display text-base mb-3 text-coconut-cream">
                <Clock
                  className="h-4 w-4 text-brushed-brass"
                  strokeWidth={1.8}
                />
                Opening Hours
              </h3>
              <div className="text-coconut-cream/70 leading-relaxed">
                {siteConfig.hours.map((h) => (
                  <p key={h.days}>
                    {h.days}: {h.time}
                  </p>
                ))}
              </div>
            </div>

            <div className="font-sans text-sm">
              <h3 className="font-display text-base mb-3 text-coconut-cream">
                Keep in touch
              </h3>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-stretch max-w-xs"
              >
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  className="flex-1 min-w-0 rounded-l-md bg-coconut-cream/10 border border-coconut-cream/20 border-r-0 px-3 py-2 text-sm text-coconut-cream placeholder:text-coconut-cream/40 focus:outline-none focus:border-brushed-brass"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex items-center justify-center px-3 rounded-r-md bg-brushed-brass text-roasted-coffee hover:bg-brushed-brass/90 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-coconut-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-sans text-xs text-coconut-cream/50">
              © {new Date().getFullYear()} K&apos;s Kitchen. All rights
              reserved.
            </p>
            <div className="flex items-center gap-4 text-coconut-cream/70">
              {SOCIALS.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="hover:text-coconut-cream transition-colors"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  );
}
