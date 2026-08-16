'use client';

import { motion } from 'framer-motion';

/**
 * Steam wisp — a single looping curl that fades/rises/sways, restarting
 * seamlessly. Each wisp gets its own delay + horizontal drift so the group
 * doesn't read as three identical clones moving in lockstep.
 */
function SteamWisp({
  x,
  delay,
  sway = 6,
}: {
  x: number;
  delay: number;
  sway?: number;
}) {
  return (
    <motion.path
      d={`M${x} 60 C ${x - sway} 48, ${x + sway} 40, ${x} 28 C ${x - sway} 18, ${x + sway} 10, ${x} 2`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: [0, 0.8, 0.8, 0], y: -14 }}
      transition={{
        duration: 2.6,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/** Bowl + looping steam wisps, curry-leaf on currentColor. Shared visual
 * reused by both the route-level LoadingScreen and the first-visit splash. */
export function SteamBowl({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`text-curry-leaf ${className}`}
      aria-hidden="true"
    >
      {/* steam */}
      <g>
        <SteamWisp x={38} delay={0} sway={5} />
        <SteamWisp x={50} delay={0.5} sway={6} />
        <SteamWisp x={62} delay={1} sway={5} />
      </g>
      {/* bowl */}
      <g transform="translate(0, 4)">
        <path
          d="M20 62 Q20 84 50 84 Q80 84 80 62 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          cx="50"
          cy="62"
          rx="30"
          ry="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          d="M28 68 Q50 76 72 68"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

/**
 * Full-screen loading state: a bowl with three staggered steam wisps,
 * curry-leaf green on coconut-cream. Drop this into app/loading.tsx for
 * route-level loading, or render directly as a Suspense fallback.
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-coconut-cream">
      <SteamBowl />
      <span className="font-hand text-xl text-clay-pot">
        Warming things up…
      </span>
    </div>
  );
}
