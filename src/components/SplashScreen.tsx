'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SteamBowl } from './LoadingScreen';

const SPLASH_DURATION_MS = 3000;

/**
 * Guaranteed first-visit splash — shown for a fixed duration on the initial
 * app load, independent of how fast the page itself renders (unlike
 * app/loading.tsx, which only appears when a route is actually waiting on
 * data). Mounted once in the root layout: because the layout persists across
 * client-side navigation in the App Router, this only fires on a true first
 * load / hard refresh, not on every route change.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Prevent scrolling behind the splash while it's up.
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-coconut-cream"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <SteamBowl className="h-28 w-28" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="font-hand text-2xl text-clay-pot"
          >
            K&apos;s Kitchen
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
