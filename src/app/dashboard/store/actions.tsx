'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ────────────────────────────────────────────────────────────
// PRODUCTS
// ────────────────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const size = String(formData.get('size') || '').trim() || null;
  const price = Number(formData.get('price') || 0);
  const tags = formData.getAll('tags').map(String);
  const image = String(formData.get('image') || '').trim() || null;
  const sort_order = Number(formData.get('sort_order') || 0);

  if (!name) {
    throw new Error('Product name is required.');
  }

  if (!description) {
    throw new Error('Product description is required.');
  }

  if (price < 0) {
    throw new Error('Price cannot be negative.');
  }

  const baseId = slugify(name);

  // Make the ID unique if a product with the same name already exists.
  let id = baseId;

  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('id', baseId)
    .maybeSingle();

  if (existing) {
    id = `${baseId}-${Date.now()}`;
  }

  const { error } = await supabase.from('products').insert({
    id,
    name,
    description,
    size,
    price,
    tags,
    image,
    sort_order,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/store');
}

// ────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ────────────────────────────────────────────────────────────

export async function updateProduct(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const size = String(formData.get('size') || '').trim() || null;
  const price = Number(formData.get('price') || 0);
  const tags = formData.getAll('tags').map(String);
  const image = String(formData.get('image') || '').trim() || null;
  const sort_order = Number(formData.get('sort_order') || 0);

  if (!id) {
    throw new Error('Product ID is required.');
  }

  if (!name) {
    throw new Error('Product name is required.');
  }

  if (!description) {
    throw new Error('Product description is required.');
  }

  if (price < 0) {
    throw new Error('Price cannot be negative.');
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description,
      size,
      price,
      tags,
      image,
      sort_order,
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/store');
}

// ────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ────────────────────────────────────────────────────────────

export async function deleteProduct(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get('id') || '');

  if (!id) {
    throw new Error('Product ID is required.');
  }

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/store');
}
