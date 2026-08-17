'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { menu, MenuItem } from '@/lib/menu-data-trial';
import { DietaryTags } from './DietaryIcons';

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG')}`;
}

export function MenuSectionV2() {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const handleItemClick = (id: string) => {
    setOpenItemId((current) => (current === id ? null : id));
  };

  return (
    <section className="px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-6xl">
        {/* PAGE HEADER */}
        <div className="mb-16">
          <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.35em] text-brushed-brass">
            K&apos;s Kitchen Gourmet
          </p>

          <h1 className="font-display text-5xl text-coconut-cream md:text-7xl">
            Our Menu
          </h1>

          <div className="mt-8 h-px w-full bg-coconut-cream/10" />
        </div>

        {/* FOOD / DRINKS */}
        {menu.map((tab) => (
          <div key={tab.id} className="mb-24 last:mb-0">
            {/* TAB TITLE */}
            <div className="mb-12">
              <h2 className="font-display text-4xl text-coconut-cream md:text-5xl">
                {tab.label}
              </h2>
            </div>

            {/* CATEGORIES */}
            {tab.categories.map((category) => (
              <section key={category.id} className="mb-16 last:mb-0">
                {/* CATEGORY HEADER */}
                <div className="mb-7">
                  <div className="flex items-end gap-6">
                    <h3 className="shrink-0 font-display text-2xl text-coconut-cream md:text-3xl">
                      {category.name}
                    </h3>

                    <div className="mb-2 hidden h-px flex-1 bg-coconut-cream/10 md:block" />
                  </div>

                  {category.description && (
                    <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-coconut-cream/50">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* ITEMS */}
                <div className="space-y-2">
                  {category.items.map((item: MenuItem) => {
                    const isOpen = openItemId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        className="overflow-hidden border-b border-coconut-cream/10"
                      >
                        {/* ITEM ROW */}
                        <button
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          aria-expanded={isOpen}
                          className="group w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-6 py-6 md:py-7">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-display text-xl text-coconut-cream transition-colors group-hover:text-brushed-brass md:text-2xl">
                                  {item.name}
                                </h4>

                                <motion.span
                                  animate={{
                                    rotate: isOpen ? 45 : 0,
                                  }}
                                  transition={{
                                    duration: 0.25,
                                    ease: 'easeOut',
                                  }}
                                  className="text-xl font-light text-brushed-brass"
                                >
                                  +
                                </motion.span>
                              </div>

                              <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-coconut-cream/50">
                                {item.description}
                              </p>

                              {item.tags.length > 0 && (
                                <div className="mt-3">
                                  <DietaryTags tags={item.tags} />
                                </div>
                              )}
                            </div>

                            <span className="shrink-0 pt-1 font-sans text-sm tracking-wide text-brushed-brass md:text-base">
                              {formatNaira(item.price)}
                            </span>
                          </div>
                        </button>

                        {/* EXPANDED IMAGE */}
                        <AnimatePresence initial={false}>
                          {isOpen && item.image && (
                            <motion.div
                              key={`image-${item.id}`}
                              initial={{
                                height: 0,
                                opacity: 0,
                              }}
                              animate={{
                                height: 'auto',
                                opacity: 1,
                              }}
                              exit={{
                                height: 0,
                                opacity: 0,
                              }}
                              transition={{
                                height: {
                                  duration: 0.5,
                                  ease: [0.22, 1, 0.36, 1],
                                },
                                opacity: {
                                  duration: 0.3,
                                },
                              }}
                              className="overflow-hidden"
                            >
                              <motion.div
                                initial={{
                                  scale: 1.04,
                                  opacity: 0,
                                }}
                                animate={{
                                  scale: 1,
                                  opacity: 1,
                                }}
                                exit={{
                                  scale: 1.04,
                                  opacity: 0,
                                }}
                                transition={{
                                  duration: 0.6,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="relative h-64 w-full md:h-[420px]"
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />

                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-roasted-coffee/70 via-transparent to-transparent" />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
