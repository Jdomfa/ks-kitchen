'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Categories ──────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get('name'));
  const tab_id = String(formData.get('tab_id'));
  const description = String(formData.get('description') || '') || null;
  const image = String(formData.get('image') || '') || null;
  const sort_order = Number(formData.get('sort_order') || 0);

  const { error } = await supabase.from('menu_categories').insert({
    id: slugify(name),
    tab_id,
    name,
    description,
    image,
    sort_order,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/menu');
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id'));
  const name = String(formData.get('name'));
  const description = String(formData.get('description') || '') || null;
  const image = String(formData.get('image') || '') || null;
  const sort_order = Number(formData.get('sort_order') || 0);

  const { error } = await supabase
    .from('menu_categories')
    .update({ name, description, image, sort_order })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/menu');
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id'));

  // Items reference categories with `on delete cascade`, so this also
  // removes every item inside it — confirmed in the UI before calling this.
  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/menu');
}

// ── Items ───────────────────────────────────────────────────

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get('name'));
  const category_id = String(formData.get('category_id'));
  const description = String(formData.get('description') || '');
  const price = Number(formData.get('price') || 0);
  const tags = formData.getAll('tags').map(String);
  const image = String(formData.get('image') || '') || null;
  const chef_note = String(formData.get('chef_note') || '') || null;
  const sort_order = Number(formData.get('sort_order') || 0);

  const { error } = await supabase.from('menu_items').insert({
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

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/menu');
}

export async function updateItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id'));
  const name = String(formData.get('name'));
  const description = String(formData.get('description') || '');
  const price = Number(formData.get('price') || 0);
  const tags = formData.getAll('tags').map(String);
  const image = String(formData.get('image') || '') || null;
  const chef_note = String(formData.get('chef_note') || '') || null;
  const sort_order = Number(formData.get('sort_order') || 0);

  const { error } = await supabase
    .from('menu_items')
    .update({ name, description, price, tags, image, chef_note, sort_order })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/menu');
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('id'));

  const { error } = await supabase.from('menu_items').delete().eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/menu');
}
