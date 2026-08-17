'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/store', label: 'Store' },
  { href: '/reservation', label: 'Reservation' },
  { href: '/#contact', label: 'Contact' },
];

/** Hamburger that morphs into an X — three bars animated with shared variants. */
function MenuToggle({ open }: { open: boolean }) {
  const top = {
    closed: { rotate: 0, y: 0 },
    open: { rotate: 45, y: 7 },
  };
  const middle = {
    closed: { opacity: 1 },
    open: { opacity: 0 },
  };
  const bottom = {
    closed: { rotate: 0, y: 0 },
    open: { rotate: -45, y: -7 },
  };
  const state = open ? 'open' : 'closed';

  return (
    <div className="flex flex-col justify-center gap-[5px] h-5 w-6">
      <motion.span
        variants={top}
        animate={state}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="block h-[1.5px] w-full bg-roasted-coffee origin-center"
      />
      <motion.span
        variants={middle}
        animate={state}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="block h-[1.5px] w-full bg-roasted-coffee"
      />
      <motion.span
        variants={bottom}
        animate={state}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="block h-[1.5px] w-full bg-roasted-coffee origin-center"
      />
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  // Lock body scroll while the overlay is open, and close it on route change.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-coconut-cream/95 backdrop-blur border-b border-roasted-coffee/10">
      <div className="mx-auto max-w-6xl px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* Logo: clear space + no distortion, per brand guide */}
          <Image
            src="/brand/logo.png"
            alt="K's Kitchen"
            width={120}
            height={92}
            className="h-14 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-sans text-sm tracking-wide uppercase text-xs">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative pb-1 transition-colors hover:text-clay-pot ${
                  isActive ? 'text-clay-pot' : 'text-roasted-coffee'
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 -bottom-0.5 h-px bg-brushed-brass transition-all ${
                    isActive ? 'w-full' : 'w-0'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-roasted-coffee/5 transition-colors"
            aria-label="View cart"
          >
            <ShoppingBag
              className="h-5 w-5 text-roasted-coffee"
              strokeWidth={1.6}
            />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-pot px-1 text-[10px] font-semibold text-coconut-cream">
                {count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden flex items-center justify-center h-10 w-10 relative z-[60]"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <MenuToggle open={open} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 top-20 z-40 bg-roasted-coffee/40 backdrop-blur-sm"
            />

            {/* Slide-in panel */}
            <motion.nav
              key="panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed top-20 right-0 z-50 h-[70vh] w-full bg-coconut-cream shadow-2xl flex flex-col px-8 pt-24 pb-10 gap-2"
            >
              {NAV.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.07,
                    duration: 0.4,
                    ease: 'easeOut',
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block py-4 font-display text-2xl uppercase tracking-wide border-b border-roasted-coffee/10 transition-colors ${
                      pathname === item.href
                        ? 'text-clay-pot'
                        : 'text-roasted-coffee'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
