'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/format';

type Status = 'idle' | 'placing' | 'placed';

export function CheckoutPage() {
  const { lines, subtotal, clearCart } = useCart();
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  const canSubmit = useMemo(
    () =>
      form.name.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.address.trim() &&
      lines.length > 0 &&
      status === 'idle',
    [form, lines, status],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('placing');
    // TODO: replace with a real payment/order flow (Stripe, Paystack, etc.)
    // This is intentionally mocked — UI/flow first, payments wired later.
    window.setTimeout(() => {
      setStatus('placed');
      clearCart();
    }, 1400);
  }

  if (status === 'placed') {
    return (
      <section className="bg-coconut-cream min-h-[60vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-sm"
        >
          <CheckCircle2
            className="mx-auto h-12 w-12 text-clay-pot"
            strokeWidth={1.4}
          />
          <h1 className="mt-4 font-display text-3xl text-roasted-coffee">
            Order Placed
          </h1>
          <p className="mt-2 font-sans text-sm text-roasted-coffee/60">
            Thanks, {form.name.split(' ')[0] || 'friend'} — this is a demo
            checkout, so nothing was actually charged. A real confirmation flow
            (and payment) will go here once it's wired up.
          </p>
          <Link
            href="/store"
            className="mt-6 inline-block rounded-full bg-clay-pot px-6 py-2.5 font-sans text-sm text-coconut-cream hover:bg-terracotta transition-colors"
          >
            Back to Store
          </Link>
        </motion.div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="bg-coconut-cream min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-2xl text-roasted-coffee">
            Your cart is empty
          </h1>
          <p className="mt-2 font-sans text-sm text-roasted-coffee/50">
            Add something to your cart before checking out.
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
          Checkout
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-10"
        >
          {/* Billing details */}
          <div className="space-y-5">
            <h2 className="font-display text-xl text-roasted-coffee mb-2">
              Billing Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                label="Full Name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                required
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                required
              />
            </div>

            <Field
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              required
            />

            <Field
              label="Street Address"
              value={form.address}
              onChange={(v) => setForm((f) => ({ ...f, address: v }))}
              required
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                label="City"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
              <Field
                label="State"
                value={form.state}
                onChange={(v) => setForm((f) => ({ ...f, state: v }))}
              />
            </div>

            <p className="font-sans text-xs text-roasted-coffee/40 pt-2">
              This is a demo checkout — no payment will actually be processed.
            </p>
          </div>

          {/* Order summary */}
          <div className="h-fit rounded-xl border border-roasted-coffee/10 bg-white/40 p-6">
            <h2 className="font-display text-xl text-roasted-coffee mb-4">
              Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              {lines.map((line) => (
                <div
                  key={line.productId}
                  className="flex justify-between font-sans text-sm text-roasted-coffee/70"
                >
                  <span className="truncate pr-2">
                    {line.name} × {line.quantity}
                  </span>
                  <span className="shrink-0">
                    {formatNaira(line.price * line.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-display text-lg text-roasted-coffee border-t border-roasted-coffee/10 pt-4 mb-6">
              <span>Total</span>
              <span>{formatNaira(subtotal)}</span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-clay-pot py-3 font-sans text-sm uppercase tracking-wide text-coconut-cream transition-colors hover:bg-terracotta disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AnimatePresence mode="wait">
                {status === 'placing' ? (
                  <motion.span
                    key="placing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Placing Order
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      strokeWidth={1.8}
                    />
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Place Order
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-left">
      <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-brushed-brass/80">
        {label}
        {required && ' *'}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-md border border-roasted-coffee/20 bg-white/60 px-3 py-2 font-sans text-sm text-roasted-coffee focus:outline-none focus:border-clay-pot transition-colors"
      />
    </label>
  );
}
