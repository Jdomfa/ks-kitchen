"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SPLASH_DURATION_MS = 9000;
const FLIP_INTERVAL_MS = 1600;

const SPLASH_IMAGES = [
  "/splash/spice-1.png",
  "/splash/spice-2.png",
  "/splash/spice-3.png",
  "/splash/spice-4.png",
  "/splash/spice-5.png",
];

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);

  // Preload every splash image before animation starts.
  useEffect(() => {
    let cancelled = false;

    const preloadImages = async () => {
      try {
        await Promise.all(
          SPLASH_IMAGES.map(
            (src) =>
              new Promise<void>((resolve) => {
                const img = new Image();

                img.src = src;

                if (img.complete) {
                  resolve();
                  return;
                }

                img.onload = () => resolve();

                // Don't leave the splash stuck forever
                // if one asset fails.
                img.onerror = () => resolve();
              }),
          ),
        );

        if (!cancelled) {
          setAssetsReady(true);
        }
      } catch {
        if (!cancelled) {
          setAssetsReady(true);
        }
      }
    };

    preloadImages();

    return () => {
      cancelled = true;
    };
  }, []);

  // Start the splash timer only after assets are ready.
  useEffect(() => {
    if (!assetsReady) return;

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(hideTimer);
  }, [assetsReady]);

  // Start rotating only after assets are loaded.
  useEffect(() => {
    if (!assetsReady || !visible) return;

    const flipTimer = setInterval(() => {
      setImageIndex(
        (current) =>
          (current + 1) % SPLASH_IMAGES.length,
      );
    }, FLIP_INTERVAL_MS);

    return () => clearInterval(flipTimer);
  }, [assetsReady, visible]);

  useEffect(() => {
    document.body.style.overflow =
      visible ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="
            fixed
            inset-0
            z-[200]
            flex
            items-center
            justify-center
            overflow-hidden
            bg-coconut-cream
          "
          style={{
            perspective: "1400px",
          }}
        >
          {!assetsReady ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ duration: 0.4 }}
              className="
                h-2
                w-2
                rounded-full
                bg-roasted-coffee
              "
            />
          ) : (
            <div
              className="
                relative
                flex
                h-full
                w-full
                items-center
                justify-center
              "
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={imageIndex}
                  initial={{
                    rotateY: -75,
                    scale: 0.92,
                    opacity: 0,
                  }}
                  animate={{
                    rotateY: 0,
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{
                    rotateY: 75,
                    scale: 0.92,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    willChange:
                      "transform, opacity",
                  }}
                  className="
                    flex
                    items-center
                    justify-center
                  "
                >
                  <img
                    src={SPLASH_IMAGES[imageIndex]}
                    alt=""
                    draggable={false}
                    decoding="async"
                    className="
                      h-auto
                      w-[240px]
                      select-none
                      object-contain
                      sm:w-[290px]
                      md:w-[340px]
                      lg:w-[380px]
                    "
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