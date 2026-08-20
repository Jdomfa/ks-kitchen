import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { display, hand, flourish } from './fonts';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import { SplashScreen } from '@/components/SplashScreen';
import { Header } from '@/components/Header';

// NOTE ON FONTS: the brand guide specifies AndyHand (hand-drawn),
// Studio MN (display), and Open Sans (sans serif). Two accent scripts
// are in play now: Homemade Apple (font-hand, used often for taglines/
// notes/marquee) and AndyHand (font-flourish, reserved for rare, big
// moments like a hero headline or signature-style callout).
//   Studio MN -> font-display, loaded via next/font/local (see ./fonts.ts)
//   Homemade Apple -> font-hand, loaded via next/font/local (see ./fonts.ts)
//   AndyHand -> font-flourish, loaded via next/font/local (see ./fonts.ts)
//   Open Sans -> font-sans, exact match, unchanged below
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
      className={`${display.variable} ${hand.variable} ${flourish.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-coconut-cream text-roasted-coffee">
        <SplashScreen />
        <CartProvider>
          <Header />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
