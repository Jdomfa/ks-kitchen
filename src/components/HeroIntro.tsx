'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function HeroIntro() {
  return (
    <section className="relative h-[calc(100dvh-5rem)] min-h-[480px] overflow-hidden bg-roasted-coffee text-coconut-cream flex items-center justify-center text-center px-6">
      {/* Background video — drop the file at public/videos/hero-bg.mp4 */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="https://res.cloudinary.com/ansp9yim/video/upload/v1786890347/overhead-shot-of-table-covered-in-food-2025-12-17-18-41-06-utc.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay so the text pops against the footage */}
      <div className="absolute inset-0 bg-roasted-coffee/65" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center"
      >
        <Image
          src="/brand/logo.png"
          alt="K's Kitchen"
          width={160}
          height={123}
          className="h-28 w-auto invert"
          priority
        />

        <p className="mt-4 font-hand text-2xl md:text-3xl text-brushed-brass">
          Served from the heart
        </p>

        <p className="mt-3 font-sans text-coconut-cream/85 max-w-xl">
          An authentic South Indian kitchen where traditional recipes, homemade
          ingredients, and genuine hospitality come together in a warm,
          contemporary setting.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/menu"
            className="rounded-full bg-clay-pot px-8 py-3 font-sans text-sm tracking-wide text-coconut-cream transition-transform hover:scale-[1.03]"
          >
            View Our Menu
          </Link>
          <Link
            href="/store"
            className="rounded-full border border-coconut-cream/40 px-8 py-3 font-sans text-sm tracking-wide text-coconut-cream transition-transform hover:scale-[1.03]"
          >
            Check Store
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
