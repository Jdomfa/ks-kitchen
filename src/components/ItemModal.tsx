'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { MenuItem } from '@/lib/menu-data-trial';
import { DietaryTags } from './DietaryIcons';

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG')}`;
}

type Props = {
  item: MenuItem | null;
  categoryImage?: string;
  onClose: () => void;
};

export function ItemModalTrial({ item, categoryImage, onClose }: Props) {
  useEffect(() => {
    if (!item) return;

    const previousOverflow = document.body.style.overflow;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, onClose]);

  const image = item?.image || categoryImage;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-roasted-coffee/80 backdrop-blur-sm p-3 md:p-8"
        >
          <motion.div
            layoutId={`item-card-${item.id}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`item-title-${item.id}`}
            className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-2xl bg-roasted-coffee shadow-2xl"
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-5 right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-roasted-coffee/80 text-coconut-cream backdrop-blur-sm transition-colors hover:bg-clay-pot"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>

            {/* IMAGE */}
            {image && (
              <motion.div
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.1,
                  duration: 0.5,
                }}
                className="relative h-64 md:h-80 w-full overflow-hidden"
              >
                <img
                  src={image}
                  alt={item.name}
                  className="h-full w-full object-cover object-center"
                  onError={(e) => {
                    console.error('Failed to load menu image:', image);
                    e.currentTarget.style.display = 'none';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-roasted-coffee via-roasted-coffee/10 to-transparent pointer-events-none" />
              </motion.div>
            )}

            {/* CONTENT */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15,
                duration: 0.4,
                ease: 'easeOut',
              }}
              className={`px-6 md:px-10 pb-10 ${
                image ? '-mt-10 relative' : 'pt-14'
              }`}
            >
              <h2
                id={`item-title-${item.id}`}
                className="font-display text-3xl md:text-4xl text-coconut-cream"
              >
                {item.name}
              </h2>

              <span className="mt-2 inline-block font-sans text-lg tracking-wide text-brushed-brass">
                {formatNaira(item.price)}
              </span>

              <p className="mt-4 max-w-md font-sans text-[15px] leading-relaxed text-coconut-cream/70">
                {item.description}
              </p>

              <div className="mt-4">
                <DietaryTags tags={item.tags} />
              </div>

              {item.chefNote && (
                <div className="mt-8 border-t border-coconut-cream/15 pt-6">
                  <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-brushed-brass">
                    Chef&apos;s Note
                  </span>

                  <p className="mt-2 max-w-md font-hand text-xl text-coconut-cream/80">
                    {item.chefNote}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
