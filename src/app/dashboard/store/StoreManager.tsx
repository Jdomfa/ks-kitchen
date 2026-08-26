'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

import { createProduct, updateProduct, deleteProduct } from './actions';

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

const ALL_TAGS = ['veggie', 'vegan', 'nuts', 'sesame'];

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG')}`;
}

export function StoreManager({ products }: { products: Product[] }) {
  const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(
    null,
  );

  const sortedProducts = [...products].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-roasted-coffee/50">
            Store
          </p>

          <p className="mt-1 font-sans text-sm text-roasted-coffee/60">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingProduct('new')}
          className="inline-flex items-center gap-1.5 rounded-full bg-clay-pot px-5 py-2.5 font-sans text-sm text-coconut-cream hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {/* PRODUCTS */}
      {sortedProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-roasted-coffee/15 bg-white/30 px-6 py-12 text-center">
          <p className="font-sans text-sm text-roasted-coffee/50">
            No products in the store yet.
          </p>

          <button
            type="button"
            onClick={() => setEditingProduct('new')}
            className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm text-clay-pot"
          >
            <Plus className="h-4 w-4" />
            Add your first product
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
            />
          ))}
        </div>
      )}

      {/* PRODUCT MODAL */}
      {editingProduct && (
        <ProductModal
          product={editingProduct === 'new' ? null : editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* PRODUCT CARD                                                */
/* ─────────────────────────────────────────────────────────── */

function ProductCard({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* PRODUCT INFO */}
        <div className="flex min-w-0 items-center gap-4">
          {/* IMAGE */}
          {product.image ? (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-roasted-coffee/5">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-roasted-coffee/5">
              <span className="font-display text-xl text-roasted-coffee/20">
                K
              </span>
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-sans text-sm font-medium text-roasted-coffee">
                {product.name}
              </p>

              {product.size && (
                <span className="rounded-full bg-roasted-coffee/5 px-2.5 py-1 font-sans text-[10px] text-roasted-coffee/50">
                  {product.size}
                </span>
              )}
            </div>

            <p className="mt-1 max-w-xl truncate font-sans text-xs text-roasted-coffee/50">
              {product.description}
            </p>

            {product.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-clay-pot/5 px-2 py-0.5 font-sans text-[9px] uppercase tracking-wide text-clay-pot"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PRICE + ACTIONS */}
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-sans text-xs text-brushed-brass">
            {formatNaira(product.price)}
          </span>

          <button
            type="button"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-roasted-coffee/20 hover:border-clay-pot"
            aria-label={`Edit ${product.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />

            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-roasted-coffee/20 text-clay-pot hover:border-clay-pot"
              aria-label={`Delete ${product.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* MODAL                                                       */
/* ─────────────────────────────────────────────────────────── */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-roasted-coffee/50 p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-coconut-cream p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-roasted-coffee">{title}</h3>

          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-roasted-coffee/60" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* FIELD                                                       */
/* ─────────────────────────────────────────────────────────── */

function field(label: string) {
  return 'block font-sans text-xs uppercase tracking-wide text-roasted-coffee/60 mb-1';
}

const inputClass =
  'w-full rounded-lg border border-roasted-coffee/20 bg-white px-3 py-2 font-sans text-sm focus:outline-none focus:border-clay-pot';

/* ─────────────────────────────────────────────────────────── */
/* PRODUCT MODAL                                               */
/* ─────────────────────────────────────────────────────────── */

function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  return (
    <Modal title={product ? 'Edit product' : 'New product'} onClose={onClose}>
      <form
        action={async (formData) => {
          if (product) {
            formData.set('id', product.id);
            await updateProduct(formData);
          } else {
            await createProduct(formData);
          }

          onClose();
        }}
        className="space-y-4"
      >
        {/* NAME */}
        <div>
          <label className={field('Name')}>Name</label>

          <input
            name="name"
            defaultValue={product?.name ?? ''}
            required
            className={inputClass}
            placeholder="House Podi"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className={field('Description')}>Description</label>

          <textarea
            name="description"
            defaultValue={product?.description ?? ''}
            rows={3}
            required
            className={inputClass}
            placeholder="A description of the product..."
          />
        </div>

        {/* SIZE */}
        <div>
          <label className={field('Size')}>Size</label>

          <input
            name="size"
            defaultValue={product?.size ?? ''}
            className={inputClass}
            placeholder="250g"
          />
        </div>

        {/* PRICE */}
        <div>
          <label className={field('Price (NGN)')}>Price (NGN)</label>

          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.price ?? ''}
            required
            className={inputClass}
            placeholder="5000"
          />
        </div>

        {/* TAGS */}
        <div>
          <label className={field('Tags')}>Dietary tags</label>

          <div className="flex flex-wrap gap-3">
            {ALL_TAGS.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-1.5 font-sans text-sm"
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={tag}
                  defaultChecked={product?.tags?.includes(tag) ?? false}
                />

                {tag}
              </label>
            ))}
          </div>
        </div>

        {/* IMAGE */}
        <div>
          <label className={field('Image URL')}>Image URL</label>

          <input
            name="image"
            defaultValue={product?.image ?? ''}
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        {/* IMAGE PREVIEW */}
        {product?.image && (
          <div className="overflow-hidden rounded-xl">
            <img
              src={product.image}
              alt={product.name}
              className="h-40 w-full object-cover"
            />
          </div>
        )}

        {/* SORT ORDER */}
        <div>
          <label className={field('Sort order')}>Sort order</label>

          <input
            name="sort_order"
            type="number"
            defaultValue={product?.sort_order ?? 0}
            className={inputClass}
          />
        </div>

        {/* SAVE */}
        <button
          type="submit"
          className="w-full rounded-full bg-clay-pot px-6 py-2.5 font-sans text-sm text-coconut-cream hover:opacity-90"
        >
          {product ? 'Save changes' : 'Create product'}
        </button>
      </form>
    </Modal>
  );
}
