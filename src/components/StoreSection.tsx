'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { products } from '@/lib/shop-data';
import { ProductCard } from './ProductCard';
import { BrandPattern } from './BrandPattern';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export function StoreSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Split hero — story on the left, color-blocked jar/pattern panel on the right.
          Stacks to a single column on mobile. */}
      <div className="grid md:grid-cols-2">
        <div className="relative flex flex-col justify-center px-6 md:px-12 py-20 md:py-28">
          <BrandPattern
            className="text-clay-pot/[0.05]"
            position="bottom-left"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative max-w-md"
          >
            <p className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-brushed-brass mb-3">
              <span className="h-px w-5 bg-brushed-brass/70 inline-block" />
              The Pantry
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-roasted-coffee">
              Take the kitchen home
            </h1>
            <p className="mt-4 font-sans text-sm text-roasted-coffee/70 leading-relaxed">
              Every jar on this shelf is something you&apos;ve already tasted at
              the table — the same podi, the same ghee, ground and cultured the
              same slow way. Order ahead, and collect it when you come in to
              eat. No delivery, no shortcuts — just the jars we cook with, going
              home with you.
            </p>
          </motion.div>
        </div>

        <div className="relative min-h-[280px] md:min-h-0 bg-clay-pot overflow-hidden">
          <BrandPattern
            className="text-coconut-cream/[0.12]"
            position="top-right"
          />
          <BrandPattern
            className="text-coconut-cream/[0.08]"
            position="bottom-left"
          />
          <div className="relative h-full flex items-center justify-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex h-40 w-40 items-center justify-center rounded-full border border-coconut-cream/40"
            >
              <span className="font-hand text-4xl text-coconut-cream">
                K&apos;s
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Story band — Meet Kala, mirrors the deck's dark storytelling slides */}
      <div className="relative overflow-hidden bg-tamarind-bark">
        <BrandPattern
          className="text-coconut-cream/[0.06]"
          position="bottom-right"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-brushed-brass mb-4">
            <span className="h-px w-5 bg-brushed-brass/70 inline-block" />
            Meet Kala
            <span className="h-px w-5 bg-brushed-brass/70 inline-block" />
          </p>
          <p className="font-hand text-2xl text-coconut-cream/90 leading-snug">
            When her family moved to Nigeria, the ingredients she grew up with
            were hard to find — so she learned every grain and technique until
            she could recreate those flavors herself.
          </p>
          <p className="mt-4 font-sans text-sm text-coconut-cream/60">
            What began as necessity became a lifelong craft. Every jar here
            carries the same care: freshly grated coconut, homemade podi, and
            the kind of patience that doesn&apos;t rush a ferment.
          </p>
        </div>
      </div>

      {/* Product grid — locked to 2 columns for a boutique, shelf-like feel */}
      <div className="relative mx-auto max-w-4xl px-6 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 gap-4 md:gap-8"
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-2 mt-14 font-sans text-xs text-roasted-coffee/50"
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
          Pickup only — no delivery. Collect your order when you come in to
          dine.
        </motion.div>
      </div>
    </section>
  );
}
