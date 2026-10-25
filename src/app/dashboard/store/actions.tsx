"use server";

import { revalidatePath } from "next/cache";

import { destroyDashboardImage } from "@/lib/cloudinary/upload";
import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "../_components/types";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Accept hosted (https) or site-relative image paths only. */
function cleanImage(value: FormDataEntryValue | null): string | null {
  const image = String(value ?? "").trim();

  if (!image) return null;
  if (image.startsWith("https://") || image.startsWith("/")) return image;

  return null;
}

function fail(error: unknown, fallback: string): ActionResult {
  console.error(fallback, error);

  return {
    ok: false,
    error: error instanceof Error ? error.message : fallback,
  };
}

function refresh() {
  revalidatePath("/dashboard/store");
  revalidatePath("/store");
}

type ProductFields = {
  name: string;
  description: string;
  size: string | null;
  price: number;
  tags: string[];
  image: string | null;
  sort_order: number;
};

function readFields(formData: FormData): ProductFields {
  return {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    size: String(formData.get("size") || "").trim() || null,
    price: Number(formData.get("price") || 0),
    tags: formData.getAll("tags").map(String),
    image: cleanImage(formData.get("image")),
    sort_order: Number(formData.get("sort_order") || 0),
  };
}

function validate(fields: ProductFields): string | null {
  if (!fields.name) return "Product name is required.";
  if (!fields.description) return "Product description is required.";
  if (fields.price < 0) return "Price cannot be negative.";

  return null;
}

// ────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ────────────────────────────────────────────────────────────

export async function createProduct(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const fields = readFields(formData);
    const problem = validate(fields);

    if (problem) {
      await destroyDashboardImage(fields.image);
      return { ok: false, error: problem };
    }

    const baseId = slugify(fields.name);

    // Make the ID unique if a product with the same name already exists.
    let id = baseId;

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", baseId)
      .maybeSingle();

    if (existing) id = `${baseId}-${Date.now()}`;

    const { error } = await supabase.from("products").insert({ id, ...fields });

    if (error) {
      await destroyDashboardImage(fields.image);
      return { ok: false, error: error.message };
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't create the product.");
  }
}

// ────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ────────────────────────────────────────────────────────────

export async function updateProduct(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const id = String(formData.get("id") || "");
    const fields = readFields(formData);

    if (!id) return { ok: false, error: "Product ID is required." };

    const problem = validate(fields);
    if (problem) return { ok: false, error: problem };

    const { data: previous } = await supabase
      .from("products")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase
      .from("products")
      .update(fields)
      .eq("id", id);

    if (error) {
      if (fields.image && fields.image !== previous?.image) {
        await destroyDashboardImage(fields.image);
      }
      return { ok: false, error: error.message };
    }

    // Replaced or removed → clean up the old Cloudinary asset.
    if (previous?.image && previous.image !== fields.image) {
      await destroyDashboardImage(previous.image);
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't save the product.");
  }
}

// ────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ────────────────────────────────────────────────────────────

export async function deleteProduct(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const id = String(formData.get("id") || "");

    if (!id) return { ok: false, error: "Product ID is required." };

    const { data: previous } = await supabase
      .from("products")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) return { ok: false, error: error.message };

    await destroyDashboardImage(previous?.image);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't delete the product.");
  }
}
