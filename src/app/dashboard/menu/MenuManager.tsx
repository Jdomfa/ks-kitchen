"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { ImageUploader } from "../_components/ImageUploader";
import { Modal } from "../_components/Modal";
import { FormError, SubmitButton } from "../_components/SubmitButton";
import type { ActionResult } from "../_components/types";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
} from "./actions";

type Tab = { id: string; label: string; sort_order: number };
type Category = {
  id: string;
  tab_id: string;
  name: string;
  description: string | null;
  image: string | null;
  sort_order: number;
};
type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  tags: string[];
  image: string | null;
  chef_note: string | null;
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
  "flex items-center justify-center rounded-full border border-roasted-coffee/20 transition-[transform,border-color,opacity] duration-150 ease-out active:scale-[0.92] disabled:opacity-40 [@media(hover:hover)]:hover:border-clay-pot";

function Thumb({ src, alt, size }: { src: string | null; alt: string; size: string }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      className={`${size} shrink-0 rounded-lg bg-roasted-coffee/5 object-cover`}
    />
  ) : (
    <div
      aria-hidden="true"
      className={`${size} flex shrink-0 items-center justify-center rounded-lg bg-roasted-coffee/5 font-display text-roasted-coffee/20`}
    >
      K
    </div>
  );
}

export function MenuManager({
  tabs,
  categories,
  items,
}: {
  tabs: Tab[];
  categories: Category[];
  items: Item[];
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);
  const [editingCategory, setEditingCategory] = useState<
    Category | "new" | null
  >(null);
  const [editingItem, setEditingItem] = useState<{
    item: Item | "new";
    categoryId: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleCategories = categories.filter((c) => c.tab_id === activeTab);

  async function runDelete(
    id: string,
    confirmText: string,
    action: (formData: FormData) => Promise<ActionResult>,
  ) {
    if (!confirm(confirmText)) return;

    setNotice(null);
    setDeletingId(id);

    const formData = new FormData();
    formData.set("id", id);

    const result = await action(formData);

    setDeletingId(null);

    if (!result.ok) setNotice(result.error);
  }

  return (
    <div>
      {notice && (
        <div className="mb-6">
          <FormError message={notice} />
        </div>
      )}

      {/* Tab switcher */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-5 py-2 font-sans text-sm transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[0.97] ${
              activeTab === tab.id
                ? "border-clay-pot bg-clay-pot text-coconut-cream"
                : "border-roasted-coffee/20 text-roasted-coffee"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleCategories.map((cat) => (
        <div
          key={cat.id}
          className="mb-8 rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {cat.image && (
                <Thumb src={cat.image} alt={cat.name} size="h-14 w-14" />
              )}
              <div className="min-w-0">
                <h2 className="font-display text-xl text-roasted-coffee">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="mt-1 max-w-md font-sans text-sm text-roasted-coffee/60">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(cat)}
                className={`${iconButton} h-8 w-8`}
                aria-label={`Edit ${cat.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                disabled={deletingId === cat.id}
                onClick={() =>
                  runDelete(
                    cat.id,
                    `Delete "${cat.name}" and all its items?`,
                    deleteCategory,
                  )
                }
                className={`${iconButton} h-8 w-8 text-clay-pot`}
                aria-label={`Delete ${cat.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-roasted-coffee/10">
            {items
              .filter((i) => i.category_id === cat.id)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Thumb src={item.image} alt={item.name} size="h-10 w-10" />

                    <div className="min-w-0">
                      <p className="font-sans text-sm text-roasted-coffee">
                        {item.name}
                      </p>
                      <p className="max-w-sm truncate font-sans text-xs text-roasted-coffee/50">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-sans text-xs text-brushed-brass">
                      {formatNaira(item.price)}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingItem({ item, categoryId: cat.id })
                      }
                      className={`${iconButton} h-7 w-7`}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() =>
                        runDelete(item.id, `Delete "${item.name}"?`, deleteItem)
                      }
                      className={`${iconButton} h-7 w-7 text-clay-pot`}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <button
            type="button"
            onClick={() => setEditingItem({ item: "new", categoryId: cat.id })}
            className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm text-clay-pot transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setEditingCategory("new")}
        className="inline-flex items-center gap-1.5 rounded-full border border-roasted-coffee/20 px-5 py-2 font-sans text-sm text-roasted-coffee transition-[transform,border-color] duration-150 ease-out active:scale-[0.97] [@media(hover:hover)]:hover:border-clay-pot"
      >
        <Plus className="h-4 w-4" /> Add category
      </button>

      {editingCategory && (
        <CategoryModal
          category={editingCategory === "new" ? null : editingCategory}
          tabId={activeTab}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {editingItem && (
        <ItemModal
          item={editingItem.item === "new" ? null : editingItem.item}
          categoryId={editingItem.categoryId}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function CategoryModal({
  category,
  tabId,
  onClose,
}: {
  category: Category | null;
  tabId: string | undefined;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <Modal title={category ? "Edit category" : "New category"} onClose={onClose}>
      <form
        action={async (formData) => {
          setError(null);

          let result: ActionResult;

          if (category) {
            formData.set("id", category.id);
            result = await updateCategory(formData);
          } else {
            formData.set("tab_id", tabId ?? "");
            result = await createCategory(formData);
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
            defaultValue={category?.name}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            defaultValue={category?.description ?? ""}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <span className={labelClass}>Image</span>
          <ImageUploader
            folder="menu"
            defaultValue={category?.image}
            onBusyChange={setUploading}
          />
        </div>

        <div>
          <label className={labelClass}>Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
            className={inputClass}
          />
        </div>

        <FormError message={error} />

        <SubmitButton disabled={uploading}>
          {uploading ? "Uploading image…" : "Save"}
        </SubmitButton>
      </form>
    </Modal>
  );
}

function ItemModal({
  item,
  categoryId,
  onClose,
}: {
  item: Item | null;
  categoryId: string;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <Modal title={item ? "Edit item" : "New item"} onClose={onClose}>
      <form
        action={async (formData) => {
          setError(null);

          let result: ActionResult;

          if (item) {
            formData.set("id", item.id);
            result = await updateItem(formData);
          } else {
            formData.set("category_id", categoryId);
            result = await createItem(formData);
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
            defaultValue={item?.name}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            defaultValue={item?.description}
            rows={3}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Price (NGN)</label>
          <input
            name="price"
            type="number"
            min="0"
            defaultValue={item?.price}
            required
            className={inputClass}
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
                  defaultChecked={item?.tags.includes(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>Image</span>
          <ImageUploader
            folder="menu"
            defaultValue={item?.image}
            onBusyChange={setUploading}
          />
        </div>

        <div>
          <label className={labelClass}>Chef&apos;s note</label>
          <textarea
            name="chef_note"
            defaultValue={item?.chef_note ?? ""}
            rows={2}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className={inputClass}
          />
        </div>

        <FormError message={error} />

        <SubmitButton disabled={uploading}>
          {uploading ? "Uploading image…" : "Save"}
        </SubmitButton>
      </form>
    </Modal>
  );
}
