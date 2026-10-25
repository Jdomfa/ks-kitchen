import { createClient } from "@/lib/supabase/server";

import { MenuManager } from "./MenuManager";

export const dynamic = "force-dynamic";

export default async function DashboardMenuPage() {
  const supabase = await createClient();

  const [
    { data: tabs, error: tabsError },
    { data: categories, error: categoriesError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabase.from("menu_tabs").select("*").order("sort_order"),
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*").order("sort_order"),
  ]);

  const loadError = tabsError ?? categoriesError ?? itemsError;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-8 font-sans text-sm text-admin-muted">
        Photos upload to Cloudinary; the link is saved with the item.
      </p>

      {loadError ? (
        <p
          role="alert"
          className="rounded-lg border border-alert/20 bg-alert/10 px-4 py-3 font-sans text-sm text-alert"
        >
          Couldn&apos;t load the menu: {loadError.message}
        </p>
      ) : (
        <MenuManager
          tabs={tabs ?? []}
          categories={categories ?? []}
          items={items ?? []}
        />
      )}
    </div>
  );
}
