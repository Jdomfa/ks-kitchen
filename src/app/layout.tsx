import type { Metadata } from 'next';
import { Quicksand, Caveat, Open_Sans } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import { SplashScreen } from '@/components/SplashScreen';

// NOTE ON FONTS: the brand guide specifies AndyHand (hand-drawn),
// Studio MN (display), and Open Sans (sans serif). Studio MN and AndyHand
// are not freely licensed web fonts, so these are close free stand-ins
// until the licensed font files are supplied:
//   AndyHand  -> Caveat   (casual script, used sparingly for accents/signatures)
//   Studio MN -> Quicksand (soft geometric display, used for headings)
//   Open Sans -> Open Sans (exact match, used for body copy)
const display = Quicksand({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const hand = Caveat({
  variable: '--font-hand',
  subsets: ['latin'],
  weight: ['500', '600'],
});

const sans = Open_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: "K's Kitchen | Authentic South Indian",
  description:
    'An authentic South Indian kitchen where traditional recipes, homemade ingredients, and genuine hospitality come together in a warm, contemporary setting.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${hand.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-coconut-cream text-roasted-coffee">
        <SplashScreen />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
