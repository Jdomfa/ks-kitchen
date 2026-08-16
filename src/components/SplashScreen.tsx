'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SPLASH_DURATION_MS = 600;
const SPLASH_VIDEO_URL =
  'https://res.cloudinary.com/ansp9yim/video/upload/v1786913518/0_Dosa_Indian_Food_1280x720.mp4';

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
          className="fixed inset-0 z-[200] overflow-hidden bg-roasted-coffee"
        >
          <video
            src={SPLASH_VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
