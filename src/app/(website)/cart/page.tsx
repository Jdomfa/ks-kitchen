import type { Metadata } from 'next';
import { CartPage } from '@/components/CartPage';

export const metadata: Metadata = {
  title: "Your Cart | K's Kitchen Store",
};

export default function Page() {
  return <CartPage />;
}
