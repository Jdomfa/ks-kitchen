'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { categories, products, type ProductCategory } from '@/lib/store-data';
import { ProductCard } from './ProductCard';
import { BrandPattern } from './BrandPattern';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';

const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Featured',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  name: 'Name: A–Z',
};

export function StorePage() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>(
    'all',
  );
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const visibleProducts = useMemo(() => {
    let list =
      activeCategory === 'all'
        ? products
        : products.filter((p) => p.category === activeCategory);

    list = [...list];
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // "Featured" — new items first, then catalog order
        list.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    }
    return list;
  }, [activeCategory, sortBy]);

  return (
    <section className="relative overflow-hidden">
      {/* Hero */}
      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-14">
        <BrandPattern
          className="text-clay-pot/[0.06]"
          position="bottom-right"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative text-center"
        >
          <h1 className="font-display text-4xl md:text-5xl text-roasted-coffee">
            The Store
          </h1>
          <p className="mt-3 font-hand text-2xl text-clay-pot/75">
            Take a little of the kitchen home — mugs, spice blends, and the
            coffee we actually brew here.
          </p>
        </motion.div>
      </div>

      {/* Catalog */}
      <div className="relative bg-banana-leaf">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/brand/patterns/philosophy-pattern.svg')",
          }}
        />
        <div className="absolute inset-0 bg-banana-leaf/55" />

        <div className="relative mx-auto max-w-6xl px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
            {/* Sidebar */}
            <aside className="space-y-8">
              <div>
                <h2 className="font-sans text-[11px] uppercase tracking-[0.25em] text-brushed-brass mb-3">
                  Categories
                </h2>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left font-sans text-sm transition-colors ${
                        activeCategory === 'all'
                          ? 'bg-clay-pot text-coconut-cream'
                          : 'text-coconut-cream/70 hover:bg-coconut-cream/10 hover:text-coconut-cream'
                      }`}
                    >
                      All Products
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          activeCategory === 'all'
                            ? 'translate-x-0.5'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => setActiveCategory(cat.id)}
                        className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left font-sans text-sm transition-colors ${
                          activeCategory === cat.id
                            ? 'bg-clay-pot text-coconut-cream'
                            : 'text-coconut-cream/70 hover:bg-coconut-cream/10 hover:text-coconut-cream'
                        }`}
                      >
                        {cat.label}
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${
                            activeCategory === cat.id
                              ? 'translate-x-0.5'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Grid */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-coconut-cream/15">
                <p className="font-sans text-sm text-coconut-cream/60">
                  Showing {visibleProducts.length} of {products.length} products
                </p>
                <label className="flex items-center gap-2 font-sans text-sm text-coconut-cream/70">
                  Sort by
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="rounded-md border border-coconut-cream/25 bg-transparent px-2 py-1.5 text-coconut-cream focus:outline-none focus:border-brushed-brass"
                  >
                    {Object.entries(SORT_LABELS).map(([value, label]) => (
                      <option
                        key={value}
                        value={value}
                        className="text-roasted-coffee"
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory + sortBy}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
                >
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {visibleProducts.length === 0 && (
                <p className="text-center py-16 font-sans text-coconut-cream/50">
                  No products in this category yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
