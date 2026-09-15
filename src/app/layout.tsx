import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { display, hand, flourish } from './fonts';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}