'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/format';

export function CartPage() {
  const { lines, setQuantity, removeFromCart, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <section className="bg-coconut-cream min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <ShoppingBag
            className="mx-auto h-10 w-10 text-roasted-coffee/25"
            strokeWidth={1.4}
          />
          <h1 className="mt-4 font-display text-2xl text-roasted-coffee">
            Your cart is empty
          </h1>
          <p className="mt-2 font-sans text-sm text-roasted-coffee/50">
            Nothing here yet — go find something worth taking home.
          </p>
          <Link
            href="/store"
            className="mt-6 inline-block rounded-full bg-clay-pot px-6 py-2.5 font-sans text-sm text-coconut-cream hover:bg-terracotta transition-colors"
          >
            Browse the Store
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-coconut-cream px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl md:text-4xl text-roasted-coffee text-center mb-10">
          Your Cart
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-10">
          {/* Line items */}
          <div className="divide-y divide-roasted-coffee/10 border-t border-b border-roasted-coffee/10">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <motion.div
                  key={line.productId}
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-4 py-5"
                >
                  <Link
                    href={`/store/${line.slug}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-coconut-cream/60 border border-roasted-coffee/10"
                  >
                    <img
                      src={line.image}
                      alt={line.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/store/${line.slug}`}
                      className="font-display text-base text-roasted-coffee hover:text-clay-pot transition-colors"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 font-sans text-sm text-roasted-coffee/50">
                      {formatNaira(line.price)}
                    </p>
                  </div>

                  <div className="flex items-center rounded-full border border-roasted-coffee/20">
                    <button
                      onClick={() =>
                        setQuantity(line.productId, line.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 items-center justify-center text-roasted-coffee hover:text-clay-pot transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </button>
                    <span className="w-6 text-center font-sans text-sm text-roasted-coffee">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(line.productId, line.quantity + 1)
                      }
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 items-center justify-center text-roasted-coffee hover:text-clay-pot transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </button>
                  </div>

                  <p className="w-20 text-right font-sans text-sm text-roasted-coffee">
                    {formatNaira(line.price * line.quantity)}
                  </p>

                  <button
                    onClick={() => removeFromCart(line.productId)}
                    aria-label={`Remove ${line.name}`}
                    className="text-roasted-coffee/30 hover:text-clay-pot transition-colors"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="h-fit rounded-xl border border-roasted-coffee/10 bg-white/40 p-6">
            <h2 className="font-display text-xl text-roasted-coffee mb-4">
              Cart Totals
            </h2>
            <div className="flex justify-between font-sans text-sm text-roasted-coffee/70 mb-2">
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <p className="font-sans text-xs text-roasted-coffee/40 mb-4">
              Shipping calculated at checkout.
            </p>
            <div className="flex justify-between font-display text-lg text-roasted-coffee border-t border-roasted-coffee/10 pt-4 mb-6">
              <span>Total</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full rounded-full bg-clay-pot py-3 text-center font-sans text-sm uppercase tracking-wide text-coconut-cream hover:bg-terracotta transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
