"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { ImageUploader } from "../_components/ImageUploader";
import { Modal } from "../_components/Modal";
import { FormError, SubmitButton } from "../_components/SubmitButton";
import type { ActionResult } from "../_components/types";
import { createProduct, updateProduct, deleteProduct } from "./actions";

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

const ALL_TAGS = ["veggie", "vegan", "nuts", "sesame"];

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

const labelClass =
  "mb-1 block font-sans text-xs uppercase tracking-wide text-roasted-coffee/60";

const inputClass =
  "w-full rounded-lg border border-roasted-coffee/20 bg-white px-3 py-2 font-sans text-sm transition-colors duration-150 focus:border-clay-pot focus:outline-none";

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-full border border-roasted-coffee/20 transition-[transform,border-color,opacity] duration-150 ease-out active:scale-[0.92] disabled:opacity-40 [@media(hover:hover)]:hover:border-clay-pot";

export function StoreManager({ products }: { products: Product[] }) {
  const [editingProduct, setEditingProduct] = useState<Product | "new" | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sortedProducts = [...products].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;

    setNotice(null);
    setDeletingId(product.id);

    const formData = new FormData();
    formData.set("id", product.id);

    const result = await deleteProduct(formData);

    setDeletingId(null);

    if (!result.ok) setNotice(result.error);
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <p className="font-sans text-sm text-roasted-coffee/60">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>

        <button
          type="button"
          onClick={() => setEditingProduct("new")}
          className="inline-flex items-center gap-1.5 rounded-full bg-clay-pot px-5 py-2.5 font-sans text-sm text-coconut-cream transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] [@media(hover:hover)]:hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {notice && (
        <div className="mb-6">
          <FormError message={notice} />
        </div>
      )}

      {/* PRODUCTS */}
      {sortedProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-roasted-coffee/15 bg-white/30 px-6 py-12 text-center">
          <p className="font-sans text-sm text-roasted-coffee/50">
            No products in the store yet.
          </p>

          <button
            type="button"
            onClick={() => setEditingProduct("new")}
            className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm text-clay-pot transition-transform duration-150 ease-out active:scale-[0.97]"
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
              deleting={deletingId === product.id}
              onEdit={() => setEditingProduct(product)}
              onDelete={() => handleDelete(product)}
            />
          ))}
        </div>
      )}

      {editingProduct && (
        <ProductModal
          product={editingProduct === "new" ? null : editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

function ProductCard({
  product,
  deleting,
  onEdit,
  onDelete,
}: {
  product: Product;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
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

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-sans text-xs text-brushed-brass">
            {formatNaira(product.price)}
          </span>

          <button
            type="button"
            onClick={onEdit}
            className={iconButton}
            aria-label={`Edit ${product.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className={`${iconButton} text-clay-pot`}
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <Modal title={product ? "Edit product" : "New product"} onClose={onClose}>
      <form
        action={async (formData) => {
          setError(null);

          let result: ActionResult;

          if (product) {
            formData.set("id", product.id);
            result = await updateProduct(formData);
          } else {
            result = await createProduct(formData);
          }

          if (result.ok) onClose();
          else setError(result.error);
        }}
        className="space-y-4"
      >
        <div>
          <label className={labelClass}>Name</label>
          <input
            name="name"
            defaultValue={product?.name ?? ""}
            required
            className={inputClass}
            placeholder="House Podi"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            defaultValue={product?.description ?? ""}
            rows={3}
            required
            className={inputClass}
            placeholder="A description of the product..."
          />
        </div>

        <div>
          <label className={labelClass}>Size</label>
          <input
            name="size"
            defaultValue={product?.size ?? ""}
            className={inputClass}
            placeholder="250g"
          />
        </div>

        <div>
          <label className={labelClass}>Price (NGN)</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.price ?? ""}
            required
            className={inputClass}
            placeholder="5000"
          />
        </div>

        <div>
          <span className={labelClass}>Dietary tags</span>
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

        <div>
          <span className={labelClass}>Image</span>
          <ImageUploader
            folder="store"
            defaultValue={product?.image}
            onBusyChange={setUploading}
          />
        </div>

        <div>
          <label className={labelClass}>Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={product?.sort_order ?? 0}
            className={inputClass}
          />
        </div>

        <FormError message={error} />

        <SubmitButton disabled={uploading}>
          {uploading
            ? "Uploading image…"
            : product
              ? "Save changes"
              : "Create product"}
        </SubmitButton>
      </form>
    </Modal>
  );
}
