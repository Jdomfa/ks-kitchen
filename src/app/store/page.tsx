import type { Metadata } from 'next';
import { StorePage } from '@/components/StorePage';

export const metadata: Metadata = {
  title: "Store | K's Kitchen",
  description:
    "Mugs, spice mixes, coffee, chai, and branded goods from K's Kitchen.",
};

export default function Page() {
  return <StorePage />;
}
