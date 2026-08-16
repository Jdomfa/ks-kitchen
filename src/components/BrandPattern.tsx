type Props = {
  /** Tailwind text-color class controlling the pattern's stroke/fill, e.g. "text-roasted-coffee/[0.06]" */
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
};

/**
 * Faint linocut-style motif (sun, waves, palms) echoing the brand guide's
 * section backgrounds. Render this absolutely inside a `relative` section
 * with `overflow-hidden`, tinted to roughly 5-8% opacity of the current
 * text color so it reads as texture, not decoration.
 */
export function BrandPattern({
  className = 'text-roasted-coffee/[0.06]',
  position = 'bottom-right',
}: Props) {
  const posClasses = {
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0 -scale-x-100',
    'top-right': 'top-0 right-0 rotate-180',
  }[position];

  return (
    <svg
      viewBox="0 0 600 400"
      className={`pointer-events-none absolute ${posClasses} w-[420px] md:w-[560px] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      {/* sun */}
      <circle cx="90" cy="260" r="34" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r1 = 42,
          r2 = 58;
        // Rounded to avoid SSR/client floating-point trig mismatches
        // (Math.cos/sin can differ in the last decimal between JS engines).
        const round = (n: number) => Math.round(n * 100) / 100;
        return (
          <line
            key={i}
            x1={round(90 + Math.cos(a) * r1)}
            y1={round(260 + Math.sin(a) * r1)}
            x2={round(90 + Math.cos(a) * r2)}
            y2={round(260 + Math.sin(a) * r2)}
          />
        );
      })}
      {/* waves */}
      <path d="M0 320 Q 60 300 120 320 T 240 320 T 360 320 T 480 320 T 600 320" />
      <path d="M0 345 Q 60 325 120 345 T 240 345 T 360 345 T 480 345 T 600 345" />
      <path d="M0 370 Q 60 350 120 370 T 240 370 T 360 370 T 480 370 T 600 370" />
      {/* palms */}
      <g strokeWidth="2.5">
        <line x1="480" y1="400" x2="480" y2="200" />
        <path d="M480 210 C 440 190 420 160 400 140" />
        <path d="M480 210 C 460 180 470 150 460 120" />
        <path d="M480 210 C 500 185 520 165 545 150" />
        <path d="M480 210 C 500 195 530 190 560 195" />
        <line x1="540" y1="400" x2="540" y2="230" />
        <path d="M540 235 C 510 220 495 200 480 180" />
        <path d="M540 235 C 555 210 575 195 600 190" />
      </g>
      {/* leaf sprig */}
      <g strokeWidth="2">
        <path d="M200 260 C 210 230 230 210 260 200" />
        <path d="M215 245 L 195 235" />
        <path d="M230 225 L 210 218" />
        <path d="M245 210 L 228 205" />
      </g>
    </svg>
  );
}
