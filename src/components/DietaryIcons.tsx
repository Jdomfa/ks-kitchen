import type { DietTag } from '@/lib/menu-data';

const common = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function VeggieIcon() {
  return (
    <svg {...common} aria-hidden="true">
      <path d="M4 20c0-8 6-14 16-15-1 10-7 16-15 16-.5 0-1 0-1-1z" />
      <path d="M9 19c2-4 5-7 9-9" />
    </svg>
  );
}

function NutsIcon() {
  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 3c4 0 6.5 3.5 6.5 8s-2.8 10-6.5 10-6.5-5.5-6.5-10S8 3 12 3z" />
      <path d="M12 3v18" />
      <path d="M9 8c1.5 1 4.5 1 6 0" />
      <path d="M8.5 13c2 1.2 5 1.2 7 0" />
    </svg>
  );
}

function SesameIcon() {
  return (
    <svg {...common} fill="currentColor" stroke="none" aria-hidden="true">
      <ellipse cx="7" cy="8" rx="2.4" ry="1.4" transform="rotate(-25 7 8)" />
      <ellipse cx="14" cy="6" rx="2.4" ry="1.4" transform="rotate(15 14 6)" />
      <ellipse
        cx="17"
        cy="13"
        rx="2.4"
        ry="1.4"
        transform="rotate(-10 17 13)"
      />
      <ellipse cx="9" cy="16" rx="2.4" ry="1.4" transform="rotate(30 9 16)" />
      <ellipse
        cx="15"
        cy="19"
        rx="2.2"
        ry="1.3"
        transform="rotate(-20 15 19)"
      />
    </svg>
  );
}

function VeganIcon() {
  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M8 8l4 8 4-8" />
    </svg>
  );
}

const ICONS: Record<
  DietTag,
  { Icon: () => React.ReactElement; label: string }
> = {
  veggie: { Icon: VeggieIcon, label: 'Veggie' },
  vegan: { Icon: VeganIcon, label: 'Vegan' },
  nuts: { Icon: NutsIcon, label: 'Nuts' },
  sesame: { Icon: SesameIcon, label: 'Sesame' },
};

export function DietaryTags({ tags }: { tags: DietTag[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex justify-center gap-3 mt-2">
      {tags.map((tag) => {
        const { Icon, label } = ICONS[tag];
        return (
          <span
            key={tag}
            className="flex flex-col items-center text-brushed-brass/80 hover:text-brushed-brass transition-colors duration-200"
            title={label}
          >
            <Icon />
            <span className="mt-0.5 text-[10px] tracking-wide uppercase font-sans">
              {label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
