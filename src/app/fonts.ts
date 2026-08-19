import localFont from 'next/font/local';

/**
 * K's Kitchen brand fonts (replacing the Quicksand/Caveat stand-ins
 * previously used in app/layout.tsx). Each exposes a CSS variable that
 * globals.css maps straight onto Tailwind's font-display / font-hand /
 * font-flourish utilities via `@theme inline`.
 *
 * Font files live in /public/fonts — copy the .ttf files there
 * (path below assumes this file sits at app/fonts.ts).
 *
 * Open Sans is left out here on purpose: it's already the real,
 * correctly-licensed brand font for font-sans, so it stays as the
 * next/font/google import in layout.tsx — nothing to swap.
 */

// Studio MN — brand display font. Headings, hero copy, item names.
export const display = localFont({
    src: '../../public/fonts/Studio_MN_Regular.woff2',
    variable: '--font-display',
    display: 'swap',
});

// Homemade Apple — everyday accent script. Used often: taglines,
// chef's notes, the marquee band, subheads.
export const hand = localFont({
    src: '../../public/fonts/HomemadeApple-Regular.ttf',
    variable: '--font-hand',
    display: 'swap',
});

// AndyHand — reserved for rare, big flourish moments only (e.g. a hero
// headline, a signature-style callout). Not for routine accent text —
// that's font-hand above.
export const flourish = localFont({
    src: '../../public/fonts/AndyHand.ttf',
    variable: '--font-flourish',
    display: 'swap',
});