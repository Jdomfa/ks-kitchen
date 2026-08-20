'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';

/**
 * Drop this into your header/nav wherever the cart icon should live.
 * Links to /store/cart and shows a small badge with the current item count.
 */
export function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/store/cart"
      aria-label="View cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-roasted-coffee hover:text-clay-pot transition-colors"
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay-pot px-1 font-sans text-[10px] leading-none text-coconut-cream">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
