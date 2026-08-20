'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Check } from 'lucide-react';
import { categories, type Product } from '@/lib/store-data';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const categoryLabel = categories.find(
    (c) => c.id === product.category,
  )?.label;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="group rounded-xl bg-coconut-cream p-3 shadow-[0_6px_20px_-8px_rgba(50,38,31,0.25)]"
    >
      <Link href={`/store/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-coconut-cream/80">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-clay-pot px-2.5 py-1 font-sans text-[10px] uppercase tracking-widest text-coconut-cream">
                New
              </span>
            )}
            {product.compareAtPrice && (
              <span className="rounded-full bg-roasted-coffee px-2.5 py-1 font-sans text-[10px] uppercase tracking-widest text-coconut-cream">
                Sale
              </span>
            )}
            {!product.inStock && (
              <span className="rounded-full bg-roasted-coffee/70 px-2.5 py-1 font-sans text-[10px] uppercase tracking-widest text-coconut-cream">
                Sold Out
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-brushed-brass/70">
            {categoryLabel}
          </p>
          <h3 className="mt-1 inline-flex items-center gap-1 font-display text-lg text-roasted-coffee underline decoration-brushed-brass/0 decoration-dotted underline-offset-4 group-hover:decoration-brushed-brass/60 transition-colors">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-sans text-sm text-clay-pot">
              {formatNaira(product.price)}
            </span>
          </div>
        </div>
      </Link>

      <button
        onClick={handleAdd}
        disabled={!product.inStock}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-roasted-coffee/15 py-2 font-sans text-xs uppercase tracking-wide text-roasted-coffee transition-colors hover:border-clay-pot hover:text-clay-pot disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-roasted-coffee/15 disabled:hover:text-roasted-coffee"
      >
        {justAdded ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={2} /> Added
          </>
        ) : (
          <>
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.8} />
            {product.inStock ? 'Add to cart' : 'Sold out'}
          </>
        )}
      </button>
    </motion.div>
  );
}
