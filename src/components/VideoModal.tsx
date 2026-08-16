'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Full embed URL, e.g. a Cloudinary player URL */
  src: string;
  title?: string;
};

/** Centered modal with a 16:9 embedded video iframe. Closes on backdrop
 * click or Escape, and locks body scroll while open. */
export function VideoModal({ open, onClose, src, title = 'Video' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-roasted-coffee/70 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-lg overflow-hidden bg-roasted-coffee shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Close video"
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-roasted-coffee/80 text-coconut-cream hover:bg-clay-pot transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
            <iframe
              src={src}
              title={title}
              style={{
                height: 'auto',
                width: '100%',
                aspectRatio: '640 / 360',
              }}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
