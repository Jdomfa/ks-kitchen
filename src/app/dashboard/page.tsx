import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = createServiceClient();

  const [menuItems, products, feedbackStats] = await Promise.all([
    supabase.from("menu_items").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    db.from("feedback").select("food_rating, service_rating").limit(5000),
  ]);

  const ratings = feedbackStats.data ?? [];
  const average = (values: number[]) =>
    values.length
      ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
      : "–";

  const sections = [
    {
      href: "/dashboard/menu",
      label: "Menu",
      description: "Categories, dishes and photos",
      stat: `${menuItems.count ?? 0} items`,
    },
    {
      href: "/dashboard/store",
      label: "Store",
      description: "Pantry products and photos",
      stat: `${products.count ?? 0} products`,
    },
    {
      href: "/dashboard/feedback",
      label: "Feedback",
      description: "What guests said",
      stat: `${ratings.length} responses · food ${average(
        ratings.map((row) => row.food_rating),
      )} · service ${average(ratings.map((row) => row.service_rating))}`,
    },
    {
      href: "/dashboard/reservations",
      label: "Reservations",
      description: "Incoming bookings",
      stat: "",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex items-center justify-between">
        <p className="text-sm text-admin-muted">
          Signed in as {user?.email}
        </p>

        <form action="/dashboard/logout" method="post">
          <button className="text-sm text-admin-muted underline transition-colors duration-150 [@media(hover:hover)]:hover:text-terracotta">
            Sign out
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl bg-admin-surface p-6 transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.98] [@media(hover:hover)]:hover:shadow-[0_8px_24px_-12px_rgba(75,58,46,0.25)]"
          >
            <h2 className="font-display text-xl text-admin-ink">
              {section.label}
            </h2>
            <p className="mt-1 text-sm text-admin-muted">
              {section.description}
            </p>
            {section.stat && (
              <p className="mt-4 text-[13px] text-terracotta">{section.stat}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
