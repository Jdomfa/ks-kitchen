"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SPLASH_DURATION_MS = 6000;
const FLIP_INTERVAL_MS = 850;

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

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const flipTimer = setInterval(() => {
      setImageIndex((current) => {
        return (current + 1) % SPLASH_IMAGES.length;
      });
    }, FLIP_INTERVAL_MS);

    return () => {
      clearInterval(flipTimer);
    };
  }, [visible]);

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
          initial={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
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
          "
          style={{
            backgroundColor: "var(--color-coconut-cream)",
            perspective: "1200px",
          }}
        >
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
                  rotateY: -90,
                  scale: 0.85,
                  opacity: 0,
                }}
                animate={{
                  rotateY: 0,
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  rotateY: 90,
                  scale: 0.85,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
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
                  className="
                    h-auto
                    w-[220px]
                    select-none
                    object-contain
                    sm:w-[280px]
                    md:w-[340px]
                    lg:w-[390px]
                  "
                />
              </motion.div>
            </AnimatePresence>

            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.4,
                duration: 0.8,
              }}
              className="
                absolute
                bottom-10
                left-1/2
                -translate-x-1/2
                text-center
              "
            >
              <p
                className="
                  text-xs
                  font-medium
                  uppercase
                  tracking-[0.35em]
                  text-[#6B4633]
                "
              >
                K&apos;s Kitchen
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
