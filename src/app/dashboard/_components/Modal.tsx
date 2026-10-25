"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/**
 * Centered modal. Modals are not anchored to a trigger, so they scale from
 * the center. Enter is a quick fade + 0.96 scale; close is instant.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-roasted-coffee/50 p-4 motion-reduce:transition-none sm:p-6"
      style={{
        opacity: shown ? 1 : 0,
        transition: `opacity 150ms ${EASE_OUT}`,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-coconut-cream p-6 shadow-[0_24px_60px_-12px_rgba(75,58,46,0.35)] motion-reduce:transition-none"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? "scale(1)" : "scale(0.96)",
          transition: `opacity 200ms ${EASE_OUT}, transform 200ms ${EASE_OUT}`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg text-roasted-coffee">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-roasted-coffee/60 transition-[transform,background-color] duration-150 ease-out active:scale-[0.94] [@media(hover:hover)]:hover:bg-roasted-coffee/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
