"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/lib/site-config";

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

function buildOrderText(
  items: { name: string; qty: number; price: number }[],
  subtotal: number,
  customerName: string,
  pickupNote: string
) {
  const lines = items.map(
    (i) => `• ${i.qty} x ${i.name} — ${formatNaira(i.price * i.qty)}`
  );
  return [
    "New Pantry order — K's Kitchen",
    customerName ? `Name: ${customerName}` : "",
    pickupNote ? `Pickup note: ${pickupNote}` : "",
    "",
    ...lines,
    "",
    `Subtotal: ${formatNaira(subtotal)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function CartPage() {
  const { items, setQty, removeItem, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [pickupNote, setPickupNote] = useState("");

  const orderText = buildOrderText(items, subtotal, name, pickupNote);
  const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
    orderText
  )}`;
  const mailHref = `mailto:${siteConfig.orderEmail}?subject=${encodeURIComponent(
    "New Pantry order — K's Kitchen"
  )}&body=${encodeURIComponent(orderText)}`;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="font-display text-3xl md:text-4xl text-roasted-coffee text-center mb-10">
            Your cart
          </h1>

          {items.length === 0 ? (
            <div className="text-center text-roasted-coffee/70 font-sans">
              <p>Your cart is empty.</p>
              <Link
                href="/store"
                className="mt-4 inline-block rounded-full bg-clay-pot px-6 py-2.5 text-sm text-coconut-cream"
              >
                Browse the Pantry
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-roasted-coffee/10 border-y border-roasted-coffee/10">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-5">
                    <div className="flex-1">
                      <p className="font-display text-roasted-coffee">{item.name}</p>
                      <p className="text-sm text-brushed-brass font-sans">
                        {formatNaira(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(item.id, item.qty - 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full border border-roasted-coffee/20"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-sans">{item.qty}</span>
                      <button
                        onClick={() => setQty(item.id, item.qty + 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full border border-roasted-coffee/20"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="w-24 text-right font-sans text-sm">
                      {formatNaira(item.price * item.qty)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-roasted-coffee/40 hover:text-clay-pot"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center py-6 font-sans">
                <span className="text-roasted-coffee/70">Subtotal</span>
                <span className="text-lg text-roasted-coffee">{formatNaira(subtotal)}</span>
              </div>

              <div className="space-y-4 mb-8">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-roasted-coffee/20 bg-white/40 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-clay-pot"
                />
                <textarea
                  placeholder="Pickup note (e.g. preferred day/time when you'll dine in)"
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-roasted-coffee/20 bg-white/40 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-clay-pot"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-full bg-curry-leaf px-6 py-3 font-sans text-sm text-coconut-cream"
                >
                  Send order via WhatsApp
                </a>
                <a
                  href={mailHref}
                  className="flex-1 text-center rounded-full border border-roasted-coffee/20 px-6 py-3 font-sans text-sm text-roasted-coffee"
                >
                  Send order via email
                </a>
              </div>
              <button
                onClick={clear}
                className="mt-6 mx-auto block text-xs text-roasted-coffee/40 underline"
              >
                Clear cart
              </button>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
