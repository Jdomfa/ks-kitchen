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
    .replace(/(^-|-$)/g, "");
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
  revalidatePath("/dashboard/menu");
  revalidatePath("/menu");
}

// ── Categories ──────────────────────────────────────────────

export async function createCategory(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const name = String(formData.get("name") || "").trim();
    const tab_id = String(formData.get("tab_id") || "");
    const description = String(formData.get("description") || "") || null;
    const image = cleanImage(formData.get("image"));
    const sort_order = Number(formData.get("sort_order") || 0);

    if (!name) return { ok: false, error: "Category name is required." };

    const { error } = await supabase.from("menu_categories").insert({
      id: slugify(name),
      tab_id,
      name,
      description,
      image,
      sort_order,
    });

    if (error) {
      // The image was already uploaded — don't leave an orphan behind.
      await destroyDashboardImage(image);
      return { ok: false, error: error.message };
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't create the category.");
  }
}

export async function updateCategory(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "") || null;
    const image = cleanImage(formData.get("image"));
    const sort_order = Number(formData.get("sort_order") || 0);

    if (!id) return { ok: false, error: "Category ID is required." };
    if (!name) return { ok: false, error: "Category name is required." };

    const { data: previous } = await supabase
      .from("menu_categories")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase
      .from("menu_categories")
      .update({ name, description, image, sort_order })
      .eq("id", id);

    if (error) {
      if (image && image !== previous?.image) {
        await destroyDashboardImage(image);
      }
      return { ok: false, error: error.message };
    }

    // Replaced or removed → clean up the old Cloudinary asset.
    if (previous?.image && previous.image !== image) {
      await destroyDashboardImage(previous.image);
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't save the category.");
  }
}

export async function deleteCategory(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const id = String(formData.get("id") || "");

    if (!id) return { ok: false, error: "Category ID is required." };

    const [{ data: category }, { data: items }] = await Promise.all([
      supabase.from("menu_categories").select("image").eq("id", id).maybeSingle(),
      supabase.from("menu_items").select("image").eq("category_id", id),
    ]);

    // Items reference categories with `on delete cascade`, so this also
    // removes every item inside it — confirmed in the UI before calling this.
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await Promise.all([
      destroyDashboardImage(category?.image),
      ...(items ?? []).map((item) => destroyDashboardImage(item.image)),
    ]);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't delete the category.");
  }
}

// ── Items ───────────────────────────────────────────────────

export async function createItem(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const name = String(formData.get("name") || "").trim();
    const category_id = String(formData.get("category_id") || "");
    const description = String(formData.get("description") || "").trim();
    const price = Number(formData.get("price") || 0);
    const tags = formData.getAll("tags").map(String);
    const image = cleanImage(formData.get("image"));
    const chef_note = String(formData.get("chef_note") || "") || null;
    const sort_order = Number(formData.get("sort_order") || 0);

    if (!name) return { ok: false, error: "Item name is required." };
    if (price < 0) return { ok: false, error: "Price cannot be negative." };

    const { error } = await supabase.from("menu_items").insert({
      id: slugify(`${category_id}-${name}`),
      category_id,
      name,
      description,
      price,
      tags,
      image,
      chef_note,
      sort_order,
    });

    if (error) {
      await destroyDashboardImage(image);
      return {
        ok: false,
        error: error.message.includes("duplicate")
          ? "An item with that name already exists in this category."
          : error.message,
      };
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't create the item.");
  }
}

export async function updateItem(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const price = Number(formData.get("price") || 0);
    const tags = formData.getAll("tags").map(String);
    const image = cleanImage(formData.get("image"));
    const chef_note = String(formData.get("chef_note") || "") || null;
    const sort_order = Number(formData.get("sort_order") || 0);

    if (!id) return { ok: false, error: "Item ID is required." };
    if (!name) return { ok: false, error: "Item name is required." };
    if (price < 0) return { ok: false, error: "Price cannot be negative." };

    const { data: previous } = await supabase
      .from("menu_items")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase
      .from("menu_items")
      .update({ name, description, price, tags, image, chef_note, sort_order })
      .eq("id", id);

    if (error) {
      if (image && image !== previous?.image) {
        await destroyDashboardImage(image);
      }
      return { ok: false, error: error.message };
    }

    if (previous?.image && previous.image !== image) {
      await destroyDashboardImage(previous.image);
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't save the item.");
  }
}

export async function deleteItem(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const id = String(formData.get("id") || "");

    if (!id) return { ok: false, error: "Item ID is required." };

    const { data: previous } = await supabase
      .from("menu_items")
      .select("image")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) return { ok: false, error: error.message };

    await destroyDashboardImage(previous?.image);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error, "Couldn't delete the item.");
  }
}
