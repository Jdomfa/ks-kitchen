'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  category: 'food' | 'interior' | 'moments';
  span?: 'tall' | 'wide' | 'normal';
};

const CATEGORIES: { id: GalleryImage['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'interior', label: 'Interior' },
  { id: 'moments', label: 'Moments' },
];

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className, direction = 'left' }: { className?: string; direction?: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function spanClasses(span: GalleryImage['span']) {
  if (span === 'tall') return 'row-span-2 aspect-[3/4]';
  if (span === 'wide') return 'sm:col-span-2 aspect-[16/9]';
  return 'aspect-square';
}

const GalleryTile = memo(function GalleryTile({
  image,
  index,
  onOpen,
}: {
  image: GalleryImage;
  index: number;
  onOpen: (id: string) => void;
}) {
  return (
    <motion.button
      layoutId={`gallery-${image.id}`}
      onClick={() => onOpen(image.id)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: (index % 6) * 0.06 }}
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      className={`group relative w-full overflow-hidden rounded-2xl bg-tamarind-bark/10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass ${spanClasses(image.span)}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-roasted-coffee/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <p className="absolute bottom-3 left-4 right-4 translate-y-2 font-hand text-lg text-coconut-cream opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {image.alt}
      </p>
    </motion.button>
  );
});

function Lightbox({
  images,
  activeId,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  activeId: string;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}) {
  const activeIndex = images.findIndex((img) => img.id === activeId);
  const active = images[activeIndex];

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    }
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose, onNavigate]);

  if (!active) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={active.alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-roasted-coffee/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close gallery"
        className="absolute right-5 top-5 rounded-full p-2 text-coconut-cream/80 transition-colors hover:bg-coconut-cream/10 hover:text-coconut-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(-1);
        }}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-coconut-cream/80 transition-colors hover:bg-coconut-cream/10 hover:text-coconut-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass sm:left-6"
      >
        <ChevronIcon className="h-7 w-7" direction="left" />
      </button>

      <motion.div
        layoutId={`gallery-${active.id}`}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative aspect-[4/5] w-full max-w-2xl overflow-hidden rounded-2xl sm:aspect-[3/2]"
      >
        <Image src={active.src} alt={active.alt} fill sizes="90vw" className="object-cover" priority />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-roasted-coffee/80 to-transparent p-5">
          <p className="font-hand text-xl text-coconut-cream">{active.alt}</p>
        </div>
      </motion.div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(1);
        }}
        aria-label="Next image"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-coconut-cream/80 transition-colors hover:bg-coconut-cream/10 hover:text-coconut-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brushed-brass sm:right-6"
      >
        <ChevronIcon className="h-7 w-7" direction="right" />
      </button>
    </motion.div>
  );
}

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [activeCategory, setActiveCategory] = useState<GalleryImage['category'] | 'all'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = activeCategory === 'all' ? images : images.filter((img) => img.category === activeCategory);

  const handleNavigate = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = filtered.findIndex((img) => img.id === activeId);
      if (currentIndex === -1) return;
      const nextIndex = (currentIndex + direction + filtered.length) % filtered.length;
      setActiveId(filtered[nextIndex].id);
    },
    [activeId, filtered]
  );

  return (
    <LayoutGroup>
      {/* Filter pills — shared-layout indicator slides fluidly between selections */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive ? 'text-coconut-cream' : 'text-roasted-coffee/60 hover:text-roasted-coffee'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="gallery-filter-pill"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-terracotta"
                />
              )}
              <span className="relative">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-roasted-coffee/15 py-20 text-center">
          <p className="font-hand text-2xl text-roasted-coffee/70">Nothing here yet</p>
          <p className="text-sm text-roasted-coffee/50">More photos from this category are on the way.</p>
        </div>
      ) : (
        <motion.div layout className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((image, index) => (
              <GalleryTile key={image.id} image={image} index={index} onOpen={setActiveId} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {activeId && (
          <Lightbox images={filtered} activeId={activeId} onClose={() => setActiveId(null)} onNavigate={handleNavigate} />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}