import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';

import { StoreManager } from './StoreManager';

type Product = {
  id: string;
  name: string;
  description: string;
  size: string | null;
  price: number;
  tags: string[];
  image: string | null;
  sort_order: number;
};

export default async function DashboardStorePage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const items = (products ?? []) as Product[];

  return (
    <div className="min-h-screen bg-coconut-cream px-6 py-16">
      <div className="mx-auto max-w-4xl">
        {/* BACK TO DASHBOARD */}
        <Link
          href="/dashboard"
          className="font-sans text-sm text-roasted-coffee/60 hover:text-clay-pot"
        >
          ← Dashboard
        </Link>

        {/* PAGE TITLE */}
        <h1 className="mt-3 mb-8 font-display text-3xl text-roasted-coffee">
          Store
        </h1>

        {/* STORE MANAGER */}
        <StoreManager products={items} />
      </div>
    </div>
  );
}
