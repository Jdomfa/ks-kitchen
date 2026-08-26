'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
} from './actions';

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

const ALL_TAGS = ['veggie', 'vegan', 'nuts', 'sesame'];

function formatNaira(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG')}`;
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
    Category | 'new' | null
  >(null);
  const [editingItem, setEditingItem] = useState<{
    item: Item | 'new';
    categoryId: string;
  } | null>(null);

  const visibleCategories = categories.filter((c) => c.tab_id === activeTab);

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-full font-sans text-sm border ${
              activeTab === tab.id
                ? 'bg-clay-pot text-coconut-cream border-clay-pot'
                : 'border-roasted-coffee/20 text-roasted-coffee'
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
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-xl text-roasted-coffee">
                {cat.name}
              </h2>
              {cat.description && (
                <p className="mt-1 font-sans text-sm text-roasted-coffee/60 max-w-md">
                  {cat.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setEditingCategory(cat)}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-roasted-coffee/20 hover:border-clay-pot"
                aria-label="Edit category"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <form
                action={async (fd) => {
                  if (!confirm(`Delete "${cat.name}" and all its items?`))
                    return;
                  fd.set('id', cat.id);
                  await deleteCategory(fd);
                }}
              >
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-roasted-coffee/20 hover:border-clay-pot text-clay-pot"
                  aria-label="Delete category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
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
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-roasted-coffee">
                      {item.name}
                    </p>
                    <p className="font-sans text-xs text-roasted-coffee/50 truncate max-w-sm">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-sans text-xs text-brushed-brass">
                      {formatNaira(item.price)}
                    </span>
                    <button
                      onClick={() =>
                        setEditingItem({ item, categoryId: cat.id })
                      }
                      className="h-7 w-7 flex items-center justify-center rounded-full border border-roasted-coffee/20 hover:border-clay-pot"
                      aria-label="Edit item"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <form
                      action={async (fd) => {
                        if (!confirm(`Delete "${item.name}"?`)) return;
                        fd.set('id', item.id);
                        await deleteItem(fd);
                      }}
                    >
                      <button
                        className="h-7 w-7 flex items-center justify-center rounded-full border border-roasted-coffee/20 hover:border-clay-pot text-clay-pot"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
          </div>

          <button
            onClick={() => setEditingItem({ item: 'new', categoryId: cat.id })}
            className="mt-4 inline-flex items-center gap-1.5 font-sans text-sm text-clay-pot"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
      ))}

      <button
        onClick={() => setEditingCategory('new')}
        className="inline-flex items-center gap-1.5 rounded-full border border-roasted-coffee/20 px-5 py-2 font-sans text-sm text-roasted-coffee hover:border-clay-pot"
      >
        <Plus className="h-4 w-4" /> Add category
      </button>

      {editingCategory && (
        <CategoryModal
          category={editingCategory === 'new' ? null : editingCategory}
          tabId={activeTab}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {editingItem && (
        <ItemModal
          item={editingItem.item === 'new' ? null : editingItem.item}
          categoryId={editingItem.categoryId}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

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
        className="w-full max-w-lg rounded-2xl bg-coconut-cream p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-roasted-coffee">{title}</h3>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-roasted-coffee/60" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function field(label: string) {
  return 'block font-sans text-xs uppercase tracking-wide text-roasted-coffee/60 mb-1';
}
const inputClass =
  'w-full rounded-lg border border-roasted-coffee/20 bg-white px-3 py-2 font-sans text-sm focus:outline-none focus:border-clay-pot';

function CategoryModal({
  category,
  tabId,
  onClose,
}: {
  category: Category | null;
  tabId: string;
  onClose: () => void;
}) {
  return (
    <Modal
      title={category ? 'Edit category' : 'New category'}
      onClose={onClose}
    >
      <form
        action={async (fd) => {
          if (category) {
            fd.set('id', category.id);
            await updateCategory(fd);
          } else {
            fd.set('tab_id', tabId);
            await createCategory(fd);
          }
          onClose();
        }}
        className="space-y-4"
      >
        <div>
          <label className={field('Name')}>Name</label>
          <input
            name="name"
            defaultValue={category?.name}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={field('Description')}>Description</label>
          <textarea
            name="description"
            defaultValue={category?.description ?? ''}
            rows={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className={field('Image URL')}>Image URL</label>
          <input
            name="image"
            defaultValue={category?.image ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className={field('Sort order')}>Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
            className={inputClass}
          />
        </div>
        <button className="w-full rounded-full bg-clay-pot px-6 py-2.5 font-sans text-sm text-coconut-cream">
          Save
        </button>
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
  return (
    <Modal title={item ? 'Edit item' : 'New item'} onClose={onClose}>
      <form
        action={async (fd) => {
          if (item) {
            fd.set('id', item.id);
            await updateItem(fd);
          } else {
            fd.set('category_id', categoryId);
            await createItem(fd);
          }
          onClose();
        }}
        className="space-y-4"
      >
        <div>
          <label className={field('Name')}>Name</label>
          <input
            name="name"
            defaultValue={item?.name}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={field('Description')}>Description</label>
          <textarea
            name="description"
            defaultValue={item?.description}
            rows={3}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={field('Price (NGN)')}>Price (NGN)</label>
          <input
            name="price"
            type="number"
            defaultValue={item?.price}
            required
            className={inputClass}
          />
        </div>
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
                  defaultChecked={item?.tags.includes(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={field('Image URL')}>Image URL</label>
          <input
            name="image"
            defaultValue={item?.image ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label className={field("Chef's note")}>Chef&apos;s note</label>
          <textarea
            name="chef_note"
            defaultValue={item?.chef_note ?? ''}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className={field('Sort order')}>Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className={inputClass}
          />
        </div>
        <button className="w-full rounded-full bg-clay-pot px-6 py-2.5 font-sans text-sm text-coconut-cream">
          Save
        </button>
      </form>
    </Modal>
  );
}
