"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const FLIP_INTERVAL_MS = 450;
const MIN_DISPLAY_MS = 1100;
const SESSION_KEY = "kk-splash-seen";

const SPLASH_IMAGES = [
  "/splash/spice-1.png",
  "/splash/spice-2.png",
  "/splash/spice-3.png",
  "/splash/spice-4.png",
  "/splash/spice-5.png",
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const readyAtRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  useEffect(() => {
    // Restore browser-only session state after the server-consistent initial render.
    if (sessionStorage.getItem(SESSION_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    Promise.all(
      SPLASH_IMAGES.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.src = src;
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    ).then(() => {
      if (cancelled) return;
      readyAtRef.current = Date.now();
      setAssetsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !assetsReady || !reducedMotion) return;
    const timer = setTimeout(() => dismiss(), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
     
  }, [visible, assetsReady, reducedMotion]);

  useEffect(() => {
    if (!visible || !assetsReady || reducedMotion) return;

    const flipTimer = setInterval(() => {
      setImageIndex((current) => {
        const next = current + 1;
        if (next >= SPLASH_IMAGES.length) {
          clearInterval(flipTimer);
          const elapsed = readyAtRef.current ? Date.now() - readyAtRef.current : 0;
          setTimeout(() => dismiss(), Math.max(0, MIN_DISPLAY_MS - elapsed));
          return current;
        }
        return next;
      });
    }, FLIP_INTERVAL_MS);

    return () => clearInterval(flipTimer);
     
  }, [visible, assetsReady, reducedMotion]);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-label="K's Kitchen is loading"
          aria-busy={!assetsReady}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-coconut-cream"
          style={{ perspective: "1400px" }}
        >
          {!assetsReady ? (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-terracotta"
                  animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            <div className="relative flex h-full w-full items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reducedMotion ? "static" : imageIndex}
                  initial={reducedMotion ? { opacity: 0 } : { rotateY: -75, scale: 0.92, opacity: 0 }}
                  animate={reducedMotion ? { opacity: 1 } : { rotateY: 0, scale: 1, opacity: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { rotateY: 75, scale: 0.92, opacity: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0.3 }
                      : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                  }
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    willChange: "transform, opacity",
                  }}
                  className="flex items-center justify-center"
                >
                  <img
                    src={SPLASH_IMAGES[imageIndex]}
                    alt=""
                    draggable={false}
                    decoding="async"
                    className="h-auto w-[240px] select-none object-contain sm:w-[290px] md:w-[340px] lg:w-[380px]"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}