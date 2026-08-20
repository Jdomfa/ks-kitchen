'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Minus, Plus, ShoppingBag, Check } from 'lucide-react';
import { categories, products, type Product } from '@/lib/store-data';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/format';
import { ProductCard } from './ProductCard';

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const [activeImage, setActiveImage] = useState(gallery[0]);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const categoryLabel = categories.find(
    (c) => c.id === product.category,
  )?.label;
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  function handleAdd() {
    addToCart(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <section className="relative overflow-hidden bg-coconut-cream">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-20">
        <Link
          href="/store"
          className="inline-flex items-center gap-1 font-sans text-sm text-roasted-coffee/60 hover:text-clay-pot transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
          Back to Store
        </Link>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <motion.div
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="aspect-square w-full overflow-hidden rounded-xl bg-coconut-cream/60 border border-roasted-coffee/10"
            >
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </motion.div>
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-3">
                {gallery.map((img) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                      activeImage === img
                        ? 'border-clay-pot'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-brushed-brass">
              {categoryLabel}
            </p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl text-roasted-coffee">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              {product.compareAtPrice && (
                <span className="font-sans text-lg text-roasted-coffee/40 line-through">
                  {formatNaira(product.compareAtPrice)}
                </span>
              )}
              <span className="font-display text-2xl text-clay-pot">
                {formatNaira(product.price)}
              </span>
            </div>

            <p className="mt-2 font-sans text-sm text-roasted-coffee/50">
              {product.inStock ? '✓ In stock' : 'Currently sold out'}
            </p>

            <p className="mt-5 font-sans text-[15px] leading-relaxed text-roasted-coffee/75 max-w-md">
              {product.shortDescription}
            </p>

            {product.inStock && (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center rounded-full border border-roasted-coffee/20">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-10 w-10 items-center justify-center text-roasted-coffee hover:text-clay-pot transition-colors"
                  >
                    <Minus className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  <span className="w-8 text-center font-sans text-sm text-roasted-coffee">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="flex h-10 w-10 items-center justify-center text-roasted-coffee hover:text-clay-pot transition-colors"
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-clay-pot py-3 font-sans text-sm uppercase tracking-wide text-coconut-cream transition-colors hover:bg-terracotta"
                >
                  {justAdded ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2} /> Added to
                      Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" strokeWidth={1.8} /> Add
                      to Cart
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Details table */}
            <dl className="mt-8 space-y-2 border-t border-roasted-coffee/10 pt-6">
              {product.details.map((d) => (
                <div
                  key={d.label}
                  className="flex justify-between font-sans text-sm"
                >
                  <dt className="text-roasted-coffee/50">{d.label}</dt>
                  <dd className="text-roasted-coffee">{d.value}</dd>
                </div>
              ))}
            </dl>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-brushed-brass/40 px-3 py-1 font-sans text-xs text-brushed-brass"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Full description */}
            <p className="mt-8 font-sans text-sm leading-relaxed text-roasted-coffee/70 border-t border-roasted-coffee/10 pt-6 max-w-md">
              {product.description}
            </p>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-20 border-t border-roasted-coffee/10 pt-12">
            <h2 className="font-display text-2xl text-roasted-coffee text-center mb-8">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10 max-w-3xl mx-auto">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
