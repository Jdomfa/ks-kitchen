'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { menu } from '@/lib/menu-data-trial';
import { DietaryTags } from './DietaryIcons';
import { BrandPattern } from './BrandPattern';
import { VideoModal } from './VideoModal';

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

const DOSA_VIDEO_SRC =
  'https://player.cloudinary.com/embed/?cloud_name=ansp9yim&public_id=0_Masala_Dosa_Indian_Food_3840x2160';

export function AccordionMenuSection() {
  const [activeTab, setActiveTab] = useState(menu[0].id);
  const [videoOpen, setVideoOpen] = useState(false);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const active = menu.find((t) => t.id === activeTab)!;

  const toggleItem = (id: string) => {
    setOpenItemId((current) => (current === id ? null : id));
  };

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
            K&apos;s Kitchen is a stage created - to showcase the goodness of
            everything in the world &amp; our love for Food, Tea, Kappi &amp;
            Everything LIFE.
          </p>
        </motion.div>

        <div className="relative flex justify-center gap-3 mt-12">
          {menu.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setOpenItemId(null);
              }}
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

      {/* Menu body — identical structure to the original menu page. Each
          category's heading/description/button and closing image band are
          unchanged. The only difference: clicking an item reveals its own
          image inline, accordion-style, below the always-visible
          name/description/price/tags. */}
      <div className="relative overflow-hidden bg-banana-leaf">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/brand/patterns/philosophy-pattern.svg')",
          }}
        />
        {/* Slight scrim so item text stays legible over the busier parts of the artwork */}
        <div className="absolute inset-0 bg-banana-leaf/55" />

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative"
          >
            {active.categories.map((cat) => (
              <div key={cat.id}>
                {/* Heading + description + (optional) dosa video button */}
                <div className="relative mx-auto max-w-2xl px-6 pt-16">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-60px' }}
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
                        className="italic font-sans text-sm text-coconut-cream/60 text-center max-w-sm mx-auto mb-4"
                      >
                        {cat.description}
                      </motion.p>
                    )}
                    {cat.id === 'dosa-collective' && (
                      <motion.div
                        variants={itemVariants}
                        className="flex justify-center"
                      >
                        <button
                          onClick={() => setVideoOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-brushed-brass/60 text-brushed-brass font-sans text-sm tracking-wide hover:bg-brushed-brass hover:text-roasted-coffee transition-colors"
                        >
                          <PlayCircle className="h-4 w-4" strokeWidth={1.8} />
                          What is a Dosa?
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Image band — unchanged from the original menu page */}
                {cat.image && (
                  <div className="py-10 md:py-14 overflow-hidden">
                    <motion.div
                      initial={{ opacity: 0, scale: 1.08, y: 30 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      className="relative h-64 md:h-96 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${cat.image})` }}
                    >
                      <div className="absolute inset-0 bg-roasted-coffee/35" />
                    </motion.div>
                  </div>
                )}

                {/* Item list — name/description/price/tags always visible,
                    exactly like the original. Clicking the item reveals its
                    image underneath, accordion-style. */}
                <div className="relative mx-auto max-w-2xl px-6 pb-16">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-60px' }}
                    className="space-y-8"
                  >
                    {cat.items.map((item) => {
                      const isOpen = openItemId === item.id;
                      const image = item.image ?? cat.image;

                      return (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          onClick={() => image && toggleItem(item.id)}
                          className={`text-center pb-8 border-b border-coconut-cream/15 last:border-0 ${
                            image ? 'cursor-pointer' : ''
                          }`}
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

                          {image && (
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  key="image"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.4,
                                    ease: 'easeInOut',
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div
                                    className="mt-5 h-48 md:h-64 w-full rounded-xl bg-cover bg-center"
                                    style={{ backgroundImage: `url(${image})` }}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        src={DOSA_VIDEO_SRC}
        title="What is a Dosa?"
      />
    </section>
  );
}
