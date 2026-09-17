import type { Metadata } from 'next';
import GalleryGrid, { type GalleryImage } from '@/components/GalleryGrid';
import OpenChatButton from '@/components/OpenChatButton';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: "Gallery | K's Kitchen",
  description: 'A look inside K\'s Kitchen — the food, the space, and the moments in between.',
};

// Replace src paths with real assets in /public/gallery. `span` controls
// the bento asymmetry — mix 'tall'/'wide'/undefined so the grid doesn't
// read as a flat, uniform tile wall.
const GALLERY_IMAGES: GalleryImage[] = [
  { id: '1', src: 'https://res.cloudinary.com/ansp9yim/image/upload/v1786913007/menu-bg-2.jpg', alt: 'Fresh masala dosa, straight off the tawa', category: 'food', span: 'tall' },
  { id: '2', src: '/gallery/dining-room.jpg', alt: 'The main dining room at golden hour', category: 'interior', span: 'wide' },
  { id: '3', src: 'https://res.cloudinary.com/ansp9yim/image/upload/v1786983887/bottom-view-chicken-nuggets-lettuce-fork-plate-salt-black-pepper-wooden-spoons-dark-table_2.jpg', alt: 'Our signature South Indian thali', category: 'food' },
  { id: '4', src: 'https://res.cloudinary.com/ansp9yim/image/upload/v1786954926/masala-dosa-is-south-indian-meal-served-with-sambhar-coconut-chutney-selective-focus_1.jpg_2.jpg', alt: 'Filter coffee, poured tableside', category: 'food' },
  { id: '5', src: '/gallery/terrace.jpg', alt: 'The terrace seating at dusk', category: 'interior', span: 'tall' },
  { id: '6', src: 'https://res.cloudinary.com/ansp9yim/image/upload/v1787002833/delicious-indian-dosa-composition.jpg', alt: 'A table set for a celebration', category: 'moments' },
  { id: '7', src: '/gallery/chutneys.jpg', alt: 'The chutney trio, made fresh daily', category: 'food' },
  { id: '8', src: '/gallery/reception.jpg', alt: 'Reception, where every visit begins', category: 'interior' },
  { id: '9', src: '/gallery/laughing-table.jpg', alt: 'Regulars, mid-laugh, mid-meal', category: 'moments', span: 'wide' },
];

export default function GalleryPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-coconut-cream">
      <main className="flex-1 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 max-w-2xl">
            <p className="font-hand text-xl text-clay-pot">
              A closer look
            </p>

            <h1 className="mt-1 font-display text-4xl tracking-tighter text-roasted-coffee md:text-6xl">
              Gallery
            </h1>

            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-roasted-coffee/60">
              The food we're proud of, the room it's served in, and the moments
              that happen in between. Have a question we haven't answered here?{' '}
              <OpenChatButton />.
            </p>
          </div>

          <GalleryGrid images={GALLERY_IMAGES} />
        </div>
      </main>
      <Footer />
    </div>
  );
}