import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MenuManager } from './MenuManager';

export default async function DashboardMenuPage() {
  const supabase = await createClient();

  const [{ data: tabs }, { data: categories }, { data: items }] =
    await Promise.all([
      supabase.from('menu_tabs').select('*').order('sort_order'),
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('sort_order'),
    ]);

  return (
    <div className="min-h-screen bg-coconut-cream px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="font-sans text-sm text-roasted-coffee/60 hover:text-clay-pot"
        >
          ← Dashboard
        </Link>
        <h1 className="font-display text-3xl text-roasted-coffee mt-3 mb-8">
          Menu
        </h1>

        <MenuManager
          tabs={tabs ?? []}
          categories={categories ?? []}
          items={items ?? []}
        />
      </div>
    </div>
  );
}
