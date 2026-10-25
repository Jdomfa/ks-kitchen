import { createClient } from "@/lib/supabase/server";

import { StoreManager } from "./StoreManager";

export const dynamic = "force-dynamic";

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
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-8 font-sans text-sm text-admin-muted">
        Photos upload to Cloudinary; the link is saved with the product.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-alert/20 bg-alert/10 px-4 py-3 font-sans text-sm text-alert"
        >
          Couldn&apos;t load the store: {error.message}
        </p>
      ) : (
        <StoreManager products={(products ?? []) as Product[]} />
      )}
    </div>
  );
}
