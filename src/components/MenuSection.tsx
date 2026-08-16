'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { menu } from '@/lib/menu-data';
import { DietaryTags } from './DietaryIcons';
import { BrandPattern } from './BrandPattern';

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG')}`;
}

export function MenuSection() {
  const [activeTab, setActiveTab] = useState(menu[0].id);
  const active = menu.find((t) => t.id === activeTab)!;

  return (
    <section className="relative overflow-hidden">
      {/* Hero — cream, with faint brand motif */}
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
            Our Menu
          </h1>
          <p className="mt-3 font-hand text-2xl text-clay-pot">
            K's Kitchen is a stage created - to showcase the goodness of
            everything in the world & our love for Food, Tea, Kappi & Everything
            LIFE.
          </p>
        </motion.div>

        <div className="relative flex justify-center gap-3 mt-12">
          {menu.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-2.5 rounded-full font-sans text-sm tracking-wide transition-colors border ${
                activeTab === tab.id
                  ? 'bg-clay-pot text-coconut-cream border-clay-pot'
                  : 'border-roasted-coffee/20 text-roasted-coffee hover:border-clay-pot'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu body — color-blocked against the brand's own pattern artwork */}
      <div
        className="relative overflow-hidden bg-banana-leaf bg-cover bg-center"
        style={{
          backgroundImage: "url('/brand/patterns/philosophy-pattern.svg')",
        }}
      >
        {/* Slight scrim so item text stays legible over the busier parts of the artwork */}
        <div className="absolute inset-0 bg-banana-leaf/55" />
        <div className="relative mx-auto max-w-5xl px-6 py-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="grid md:grid-cols-2 gap-x-16 gap-y-14"
            >
              {active.categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  className={i % 2 === 0 ? '' : 'md:mt-0'}
                >
                  <motion.div
                    variants={itemVariants}
                    className="text-center mb-2"
                  >
                    <span className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.25em] text-brushed-brass">
                      <span className="h-px w-4 bg-brushed-brass/70 inline-block" />
                      Menu
                      <span className="h-px w-4 bg-brushed-brass/70 inline-block" />
                    </span>
                  </motion.div>
                  <motion.h2
                    variants={itemVariants}
                    className="font-display text-3xl md:text-4xl uppercase tracking-wide text-coconut-cream text-center mb-2"
                  >
                    {cat.name}
                  </motion.h2>
                  {cat.description && (
                    <motion.p
                      variants={itemVariants}
                      className="italic font-sans text-sm text-coconut-cream/60 text-center max-w-sm mx-auto mb-8"
                    >
                      {cat.description}
                    </motion.p>
                  )}
                  <div className="space-y-8">
                    {cat.items.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        className="text-center pb-8 border-b border-coconut-cream/15 last:border-0"
                      >
                        <h3 className="font-display text-lg text-coconut-cream">
                          {item.name}
                        </h3>
                        <p className="mt-1 font-sans text-sm text-coconut-cream/60 max-w-sm mx-auto">
                          {item.description}
                        </p>
                        <span className="mt-2 inline-block font-sans text-md tracking-wide text-brushed-brass">
                          {formatNaira(item.price)}
                        </span>
                        <DietaryTags tags={item.tags} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
