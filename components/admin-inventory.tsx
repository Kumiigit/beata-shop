'use client';
/* eslint-disable @next/next/no-img-element */

import { useAdminTheme } from '@/hooks/use-admin-theme';
import { StoreImage } from './store-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Eye,
  EyeOff,
  ImagePlus,
  LogOut,
  Minus,
  Moon,
  Sun,
  PackagePlus,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Product, ProductColour, ProductVariant } from '@/types/store';
import { formatGBP } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import './admin-layout.css';
import './admin-theme.css';
import { AdminCollections } from './admin-collections';
import { AdminImport } from './admin-import';
import { AdminHomepageMedia } from './admin-homepage-media';
import { listProductCategories } from '@/lib/product-categories';
import { MAX_PRODUCT_IMAGES } from '@/lib/product-images';
import { PRODUCT_AUDIENCES, type ProductAudience } from '@/lib/product-audiences';

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SIZE_ORDER = ['XXS', 'XS', ...DEFAULT_SIZES];
function sortSizes(sizes: string[]) {
  return [...sizes].sort((left, right) => {
    const leftRank = SIZE_ORDER.indexOf(left.trim().toUpperCase());
    const rightRank = SIZE_ORDER.indexOf(right.trim().toUpperCase());
    return (leftRank < 0 ? SIZE_ORDER.length : leftRank) -
      (rightRank < 0 ? SIZE_ORDER.length : rightRank);
  });
}
function sortVariantsBySize(variants: ProductVariant[]) {
  return [...variants].sort((left, right) => {
    const leftRank = SIZE_ORDER.indexOf(left.size.trim().toUpperCase());
    const rightRank = SIZE_ORDER.indexOf(right.size.trim().toUpperCase());
    if (leftRank >= 0 && rightRank >= 0) return leftRank - rightRank;
    if (leftRank >= 0) return -1;
    if (rightRank >= 0) return 1;
    return 0;
  });
}
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const makeVariant = (
  productId: string,
  size: string,
  index: number,
  stock = 10,
): ProductVariant => {
  const unique = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  const productToken = slugify(productId).replaceAll('-', '').slice(-10).toUpperCase();
  return {
    id: `${productId}-${slugify(size)}-${unique.toLowerCase()}`,
    productId,
    sku: `BEA-${productToken}-${slugify(size).toUpperCase()}-${index + 1}-${unique}`,
    size,
    stockOnHand: stock,
    reserved: 0,
    available: stock,
    active: true,
    printAreaWidthCm: 40.4,
    printAreaHeightCm: 65,
  };
};

type Availability = 'all' | 'in-stock' | 'low-stock' | 'sold-out';
type Visibility = 'all' | 'shown' | 'hidden';

function totalAvailable(product: Product) {
  return product.variants.reduce((sum, item) => sum + item.available, 0);
}
function stockState(product: Product) {
  const available = totalAvailable(product);
  if (available === 0) return { key: 'sold-out', label: 'Sold out' };
  if (product.variants.some((item) => item.active && item.available <= 3))
    return { key: 'low-stock', label: 'Low stock' };
  return { key: 'in-stock', label: 'In stock' };
}
function newProduct(): Product {
  const id = `new-${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    slug: '',
    name: '',
    category: 'T-shirts',
    audiences: [],
    description: '',
    pricePence: 2600,
    featured: false,
    active: false,
    customPrintingAvailable: false,
    createdAt: new Date().toISOString(),
    details: ['Comfortable everyday fit', 'Original Beata Shop product'],
    imageUrls: [],
    colours: [],
    variants: DEFAULT_SIZES.map((size, index) => makeVariant(id, size, index)),
  };
}

export function AdminInventory({
  initialProducts,
  email,
  localStorageOnly = false,
}: {
  initialProducts: Product[];
  email: string;
  localStorageOnly?: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const categories = listProductCategories(products);
  const [darkMode, setDarkMode] = useAdminTheme();
  useEffect(() => {
    document.body.dataset.adminTheme = darkMode ? 'dark' : 'light';
    return () => { delete document.body.dataset.adminTheme; };
  }, [darkMode]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [imageDropTarget, setImageDropTarget] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState<Availability>('all');
  const [visibility, setVisibility] = useState<Visibility>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkSizes, setBulkSizes] = useState<string[]>(DEFAULT_SIZES);
  const [bulkStock, setBulkStock] = useState(10);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editor, setEditor] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  function swapImages(source: string, target: string) {
    setEditor((current) => {
      if (!current) return current;
      const images = [...(current.imageUrls ?? [])];
      const from = images.indexOf(source);
      const to = images.indexOf(target);
      if (from < 0 || to < 0 || from === to) return current;
      [images[from], images[to]] = [images[to], images[from]];
      return { ...current, imageUrls: images };
    });
  }
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch =
          `${product.name} ${product.category} ${product.variants.map((item) => item.sku).join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase().trim());
        const state = stockState(product).key;
        return (
          matchesSearch &&
          (category === 'all' || product.category === category) &&
          (availability === 'all' || availability === state) &&
          (visibility === 'all' ||
            (visibility === 'shown' ? product.active : !product.active))
        );
      }),
    [products, query, category, availability, visibility],
  );

  const totalStock = products.reduce(
    (total, product) => total + totalAvailable(product),
    0,
  );
  const lowStock = products.filter(
    (product) => stockState(product).key !== 'in-stock',
  ).length;
  const selectedProducts = products.filter((product) =>
    selectedProductIds.includes(product.id),
  );
  const allVisibleSelected =
    visibleProducts.length > 0 &&
    visibleProducts.every((product) => selectedProductIds.includes(product.id));

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function toggleVisibleProducts() {
    setSelectedProductIds((current) => {
      const visibleIds = visibleProducts.map((product) => product.id);
      return allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])];
    });
  }

  function toggleBulkSize(size: string) {
    setBulkSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : sortSizes([...current, size]),
    );
  }

  async function addSizesToSelectedProducts() {
    if (!selectedProducts.length || !bulkSizes.length || bulkSaving) return;
    const clothingProducts = selectedProducts.filter(
      (product) => product.category !== 'Mugs',
    );
    if (!clothingProducts.length) {
      setStatus('Mugs do not use clothing sizes. Select a clothing product.');
      return;
    }
    const updates = clothingProducts.map((product) => {
      const existing = new Set(
        product.variants.map((variant) => variant.size.trim().toUpperCase()),
      );
      const missing = bulkSizes.filter(
        (size) => !existing.has(size.toUpperCase()),
      );
      return {
        ...product,
        variants: sortVariantsBySize([
          ...product.variants,
          ...missing.map((size, index) =>
            makeVariant(
              product.id,
              size,
              product.variants.length + index,
              bulkStock,
            ),
          ),
        ]),
      };
    });
    setBulkSaving(true);
    setStatus(`Updating ${updates.length} product${updates.length === 1 ? '' : 's'}…`);
    const results = await Promise.all(
      updates.map(async (product) => {
        const response = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ product }),
        });
        return { product, ok: response.ok };
      }),
    );
    const saved = results.filter((result) => result.ok).map((result) => result.product);
    const savedById = new Map(saved.map((product) => [product.id, product]));
    setProducts((current) =>
      current.map((product) => savedById.get(product.id) ?? product),
    );
    const skippedMugs = selectedProducts.length - clothingProducts.length;
    const failed = updates.length - saved.length;
    setStatus(
      failed
        ? `${saved.length} updated; ${failed} could not be saved.`
        : `Added missing sizes to ${saved.length} product${saved.length === 1 ? '' : 's'}${skippedMugs ? `; skipped ${skippedMugs} mug product${skippedMugs === 1 ? '' : 's'}` : ''}.`,
    );
    setBulkSaving(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (editor && dialog && !dialog.open) dialog.showModal();
    if (!editor && dialog?.open) dialog.close();
  }, [editor]);
  function openEditor(product?: Product) {
    setCreating(!product);
    const next = structuredClone(product ?? newProduct());
    next.imageUrls ??= [];
    next.colours ??= [];
    next.audiences ??= [];
    if (
      next.category === 'Mugs' &&
      (next.variants.length !== 1 || next.variants[0]?.size !== 'One size')
    )
      next.variants = [
        makeVariant(next.id, 'One size', 0, totalAvailable(next)),
      ];
    else next.variants = sortVariantsBySize(next.variants);
    setEditor(next);
    setStatus('');
  }
  function closeEditor() {
    if (saving) return;
    setEditor(null);
    setCreating(false);
  }
  function patchEditor(value: Partial<Product>) {
    setEditor((current) => (current ? { ...current, ...value } : current));
  }
  function patchVariant(variantId: string, value: Partial<ProductVariant>) {
    setEditor((current) =>
      current
        ? {
            ...current,
            variants: current.variants.map((item) =>
              item.id === variantId
                ? {
                    ...item,
                    ...value,
                    available: Math.max(
                      (value.stockOnHand ?? item.stockOnHand) - item.reserved,
                      0,
                    ),
                  }
                : item,
            ),
          }
        : current,
    );
  }
  function adjustStock(item: ProductVariant, amount: number) {
    patchVariant(item.id, {
      stockOnHand: Math.max(item.reserved, item.stockOnHand + amount),
    });
  }
  function toggleNewSize(size: string) {
    if (!editor) return;
    const exists = editor.variants.find((item) => item.size === size);
    patchEditor({
      variants: exists
        ? editor.variants.filter((item) => item.id !== exists.id)
        : [
            ...editor.variants,
            makeVariant(editor.id, size, editor.variants.length),
          ],
    });
  }
  function changeCategory(nextCategory: string) {
    if (!editor) return;
    const wasMug = editor.category === 'Mugs';
    if (nextCategory === 'Mugs')
      patchEditor({
        category: nextCategory,
        variants: [
          makeVariant(editor.id, 'One size', 0, totalAvailable(editor)),
        ],
      });
    else if (wasMug)
      patchEditor({
        category: nextCategory,
        variants: DEFAULT_SIZES.map((size, index) =>
          makeVariant(
            editor.id,
            size,
            index,
            editor.variants[0]?.stockOnHand ?? 10,
          ),
        ),
      });
    else patchEditor({ category: nextCategory });
  }
  function updateColour(id: string, value: Partial<ProductColour>) {
    patchEditor({
      colours: (editor?.colours ?? []).map((colour) =>
        colour.id === id ? { ...colour, ...value } : colour,
      ),
    });
  }
  function addColour() {
    if (!editor) return;
    patchEditor({
      colours: [
        ...(editor.colours ?? []),
        {
          id: crypto.randomUUID(),
          name: '',
          imageUrl: editor.imageUrls?.[0] ?? '',
          backImageUrl: '',
          pricePence: null,
        },
      ],
    });
  }
  async function uploadImages(files: FileList | null) {
    if (!files || !editor) return;
    const accepted = Array.from(files).slice(
      0,
      Math.max(0, MAX_PRODUCT_IMAGES - (editor.imageUrls?.length ?? 0)),
    );
    if (!accepted.length) return;
    setUploading(true);
    setStatus('Uploading product images…');
    const urls: string[] = [];
    try {
      for (const file of accepted) {
        const body = new FormData();
        body.append('image', file);
        const response = await fetch('/api/admin/product-image', {
          method: 'POST',
          body,
        });
        const data = (await response.json()) as {
          url?: string;
          error?: string;
        };
        if (!response.ok || !data.url)
          throw new Error(data.error ?? 'Image upload failed.');
        urls.push(data.url);
      }
      patchEditor({ imageUrls: [...(editor.imageUrls ?? []), ...urls] });
      setStatus(
        `${urls.length} image${urls.length === 1 ? '' : 's'} uploaded.`,
      );
    } catch (reason) {
      setStatus(
        reason instanceof Error ? reason.message : 'Image upload failed.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveEditor(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    if (
      !editor.name.trim() ||
      !editor.description.trim() ||
      !editor.variants.length
    ) {
      setStatus(
        `Please add a name, description and ${editor.category === 'Mugs' ? 'stock amount' : 'at least one size'}.`,
      );
      return;
    }
    const clean = {
      ...editor,
      name: editor.name.trim(),
      slug: slugify(editor.name),
      description: editor.description.trim(),
      variants: sortVariantsBySize(editor.variants),
    };
    setSaving(true);
    setStatus('Saving product…');
    const response = await fetch('/api/admin/products', {
      method: creating ? 'POST' : 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ product: clean }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (response.ok) {
      setProducts((current) =>
        creating
          ? [clean, ...current]
          : current.map((product) =>
              product.id === clean.id ? clean : product,
            ),
      );
      setStatus(`Saved “${clean.name}”.`);
      setSaving(false);
      closeEditor();
    } else {
      setStatus(data.error ?? 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !editor ||
      creating ||
      !window.confirm(`Delete “${editor.name}”? This cannot be undone.`)
    )
      return;
    setSaving(true);
    const response = await fetch(
      `/api/admin/products?id=${encodeURIComponent(editor.id)}`,
      { method: 'DELETE' },
    );
    if (response.ok) {
      setProducts((current) => current.filter((item) => item.id !== editor.id));
      setStatus(`Deleted “${editor.name}”.`);
      setSaving(false);
      closeEditor();
    } else {
      setStatus('Could not delete the product.');
      setSaving(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    window.location.reload();
  }

  return (
    <main className="inventory-page spectrum-inventory">
      {localStorageOnly && <aside className="collection-admin" role="note"><strong>Local inventory — this computer only</strong><p>Products and uploaded photos here are not synced to the live shop. For live stock changes, use <a href="https://beata-shop.co/admin/inventory">beata-shop.co admin</a>.</p></aside>}
      <header className="spectrum-admin-header">
        <div>
          <p>Beata-shop.co / Admin</p>
          <h1>Inventory</h1>
          <span>All your shop products in one place.</span>
        </div>
        <nav aria-label="Admin links">
          <Button variant="outline" aria-pressed={darkMode} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun /> : <Moon />} {darkMode ? 'Light mode' : 'Dark mode'}
          </Button>
          <a href="#custom-orders">Custom orders</a>
          <Link href="/admin/insights">Insights</Link>
          <Link prefetch={false} href="/shop">View shop</Link>
          <Button variant="outline" onClick={logout}>
            <LogOut /> Sign out
          </Button>
        </nav>
      </header>

      <section className="spectrum-summary" aria-label="Inventory summary">
        <div>
          <strong>{products.length}</strong>
          <span>Products</span>
        </div>
        <div>
          <strong>{totalStock}</strong>
          <span>Items available</span>
        </div>
        <div className={lowStock ? 'needs-attention' : ''}>
          <strong>{lowStock}</strong>
          <span>Products needing attention</span>
        </div>
        <p>
          Signed in as <strong>{email}</strong>
        </p>
      </section>

      <AdminCollections products={products} />
      <AdminHomepageMedia />
      <AdminImport />
      <div className="spectrum-toolbar">
        <div>
          <h2>Products</h2>
          <p>Search, filter or select a product to make changes.</p>
        </div>
        <Button className="spectrum-primary" onClick={() => openEditor()}>
          <PackagePlus /> Add product
        </Button>
      </div>

      <section className="spectrum-filters" aria-label="Product filters">
        <label className="spectrum-search">
          <span>Search products</span>
          <div>
            <Search aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or stock code"
            />
          </div>
        </label>
        <label>
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Stock</span>
          <select
            value={availability}
            onChange={(event) =>
              setAvailability(event.target.value as Availability)
            }
          >
            <option value="all">All stock levels</option>
            <option value="in-stock">In stock</option>
            <option value="low-stock">Low stock</option>
            <option value="sold-out">Sold out</option>
          </select>
        </label>
        <label>
          <span>Shop visibility</span>
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as Visibility)
            }
          >
            <option value="all">Shown and hidden</option>
            <option value="shown">Shown in shop</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <button
          type="button"
          className="reset-filters"
          onClick={() => {
            setQuery('');
            setCategory('all');
            setAvailability('all');
            setVisibility('all');
          }}
        >
          Reset
        </button>
      </section>

      {selectedProductIds.length > 0 && (
        <section className="bulk-size-panel" aria-label="Bulk product sizes">
          <div className="bulk-size-heading">
            <div>
              <strong>{selectedProductIds.length} selected</strong>
              <span>Add any missing sizes without changing existing stock.</span>
            </div>
            <button type="button" onClick={() => setSelectedProductIds([])}>
              Clear selection
            </button>
          </div>
          <fieldset className="drawer-size-choice bulk-size-choice">
            <legend>Sizes to ensure are available</legend>
            <div>
              {DEFAULT_SIZES.map((size) => (
                <label key={size}>
                  <input
                    type="checkbox"
                    checked={bulkSizes.includes(size)}
                    onChange={() => toggleBulkSize(size)}
                  />
                  <span>{size}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="bulk-stock-input">
            <span>Starting stock for each newly added size</span>
            <Input
              type="number"
              min={0}
              max={100000}
              value={bulkStock}
              onChange={(event) =>
                setBulkStock(
                  Math.max(0, Math.min(100000, Number(event.target.value) || 0)),
                )
              }
            />
          </label>
          <Button
            className="spectrum-primary"
            type="button"
            disabled={!bulkSizes.length || bulkSaving}
            onClick={addSizesToSelectedProducts}
          >
            <Save /> {bulkSaving ? 'Updating…' : 'Add missing sizes'}
          </Button>
        </section>
      )}

      <p
        className={`spectrum-status ${status ? 'is-visible' : ''}`}
        aria-live="polite"
      >
        {status || `${visibleProducts.length} products`}
      </p>
      <div className="spectrum-table-wrap">
        <table className="spectrum-product-table">
          <thead>
            <tr>
              <th className="spectrum-select-cell">
                <input
                  type="checkbox"
                  aria-label={allVisibleSelected ? 'Deselect all visible products' : 'Select all visible products'}
                  checked={allVisibleSelected}
                  onChange={toggleVisibleProducts}
                />
              </th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Shop visibility</th>
              <th>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => {
              const state = stockState(product);
              return (
                <tr key={product.id}>
                  <td className="spectrum-select-cell">
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                    />
                  </td>
                  <td>
                    <div className="spectrum-product-name">
                      {product.imageUrls?.[0] ? <StoreImage className="admin-product-thumbnail" src={product.imageUrls[0]} alt={product.name} width={58} height={58} sizes="58px" /> : <span aria-label="No product photo"><ImagePlus aria-hidden="true" /></span>}
                      <strong>{product.name}</strong>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td className="spectrum-price">
                    {formatGBP(product.pricePence)}
                  </td>
                  <td>
                    <span className={`spectrum-stock status-${state.key}`}>
                      {state.label} · {totalAvailable(product)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`spectrum-visibility ${product.active ? 'is-shown' : ''}`}
                    >
                      {product.active ? (
                        <Eye aria-hidden="true" />
                      ) : (
                        <EyeOff aria-hidden="true" />
                      )}
                      {product.active ? 'Shown' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      onClick={() => openEditor(product)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visibleProducts.length && (
          <div className="spectrum-empty">
            <Search aria-hidden="true" />
            <h3>No products found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="spectrum-drawer"
        onCancel={(event) => {
          event.preventDefault();
          closeEditor();
        }}
      >
        {editor && (
          <>
            <header>
              <div>
                <p>{creating ? 'New product' : 'Editing product'}</p>
                <h2>{creating ? 'Add product' : editor.name}</h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Close editor"
              >
                <X />
              </button>
            </header>
            <form onSubmit={saveEditor}>
              <section className="drawer-section">
                <h3>Product details</h3>
                <div className="drawer-form-grid">
                  <label>
                    <span>Product name</span>
                    <Input
                      value={editor.name}
                      onChange={(event) =>
                        patchEditor({ name: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    <span>Category</span>
                    <select
                      value={editor.category}
                      onChange={(event) => changeCategory(event.target.value)}
                    >
                      {categories.map((item) => (
                        <option value={item} key={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset className="drawer-wide drawer-audience">
                    <legend>Shop for</legend>
                    <p>Leave all unchecked to show this product in Women, Men and Kids.</p>
                    <div>
                      {PRODUCT_AUDIENCES.map((audience) => (
                        <label key={audience}>
                          <input
                            type="checkbox"
                            checked={editor.audiences?.includes(audience) ?? false}
                            onChange={(event) => {
                              const selected = editor.audiences ?? [];
                              patchEditor({ audiences: event.target.checked
                                ? [...selected, audience]
                                : selected.filter((item: ProductAudience) => item !== audience) });
                            }}
                          />
                          <span>{audience === 'women' ? 'Women' : audience === 'men' ? 'Men' : 'Kids'}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label>
                    <span>Default price in pounds</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(editor.pricePence / 100).toFixed(2)}
                      onChange={(event) =>
                        patchEditor({
                          pricePence: Math.round(
                            (Number(event.target.value) || 0) * 100,
                          ),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="drawer-check">
                    <input
                      type="checkbox"
                      checked={editor.featured}
                      onChange={(event) =>
                        patchEditor({ featured: event.target.checked })
                      }
                    />
                    <span>Show as featured</span>
                  </label>
                  <label className="drawer-wide">
                    <span>Description</span>
                    <textarea
                      rows={5}
                      value={editor.description}
                      onChange={(event) =>
                        patchEditor({ description: event.target.value })
                      }
                      required
                    />
                  </label>
                </div>
              </section>
              <section className="drawer-section">
                <div className="drawer-section-heading">
                  <div>
                    <h3>Photos</h3>
                    <p>
                      Add up to {MAX_PRODUCT_IMAGES} JPG, PNG or WebP images. The first is the main
                      shop image.
                    </p>
                  </div>
                  <span>{editor.imageUrls?.length ?? 0} / {MAX_PRODUCT_IMAGES}</span>
                </div>
                <label className="drawer-image-upload">
                  <ImagePlus />
                  <span>
                    {uploading ? 'Uploading…' : 'Choose product images'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading || (editor.imageUrls?.length ?? 0) >= MAX_PRODUCT_IMAGES}
                    onChange={(event) => {
                      void uploadImages(event.target.files);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <p className="image-reorder-help">Drag a photo onto another to swap their positions. The first photo is the main shop image. You can also choose a position below each photo, then save your changes.</p>
                <div className="drawer-image-grid reorderable-images">
                  {editor.imageUrls?.map((url, index) => (
                    <figure key={url}
                      className={imageDropTarget === url ? 'image-drop-target' : ''}
                    >
                      <button type="button" className="image-reorder-button"
                      aria-label={`Choose position for image ${index + 1}`}
                      disabled={saving || uploading}
                      draggable={!saving && !uploading}
                      onClick={(event) => event.currentTarget.parentElement?.querySelector('select')?.focus()}
                      onDragStart={(event) => { setDraggedImage(url); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', url); }}
                      onDragOver={(event) => { if (draggedImage && !saving && !uploading) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setImageDropTarget(url); } }}
                      onDragLeave={() => setImageDropTarget(null)}
                      onDragEnd={() => { setDraggedImage(null); setImageDropTarget(null); }}
                      onDrop={(event) => { event.preventDefault(); if (draggedImage && !saving && !uploading) swapImages(draggedImage, url); setDraggedImage(null); setImageDropTarget(null); }}
                    >
                      <StoreImage src={url} alt={`Product photo ${index + 1}`} width={400} height={400} sizes="160px" draggable={false} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove image ${index + 1}`}
                        onClick={() =>
                          patchEditor({
                            imageUrls: editor.imageUrls?.filter(
                              (item) => item !== url,
                            ),
                            colours: editor.colours?.map((colour) =>
                              colour.imageUrl === url || colour.backImageUrl === url
                                ? { ...colour, imageUrl: colour.imageUrl === url ? '' : colour.imageUrl, backImageUrl: colour.backImageUrl === url ? '' : colour.backImageUrl }
                                : colour,
                            ),
                          })
                        }
                      >
                        <X />
                      </button>
                      <figcaption>
                        <select aria-label={`Position of image ${index + 1}`} value={index} disabled={saving || uploading} onChange={(event) => { const target = editor.imageUrls?.[Number(event.target.value)]; if (target) swapImages(url, target); }}>
                          {editor.imageUrls?.map((_, position) => <option key={position} value={position}>{position === 0 ? 'Main image' : `Image ${position + 1}`}</option>)}
                        </select>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
              <section className="drawer-section">
                <div className="drawer-section-heading">
                  <div>
                    <h3>Colours or designs</h3>
                    <p>
                      Each option can show a different photo and use its own
                      price.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addColour}
                    disabled={(editor.colours?.length ?? 0) >= 20}
                  >
                    <Plus /> Add colour
                  </Button>
                </div>
                {!editor.colours?.length ? (
                  <p className="drawer-empty-note">
                    No colour options yet. The default image and price will be
                    used.
                  </p>
                ) : (
                  <div className="drawer-colour-list">
                    {editor.colours.map((colour) => (
                      <div className="drawer-colour-row" key={colour.id}>
                        <label>
                          <span>Colour / design name</span>
                          <Input
                            value={colour.name}
                            placeholder="e.g. Pink"
                            onChange={(event) =>
                              updateColour(colour.id, {
                                name: event.target.value,
                              })
                            }
                            required
                          />
                        </label>
                        <label>
                          <span>Front image</span>
                          <select
                            value={colour.imageUrl}
                            onChange={(event) =>
                              updateColour(colour.id, {
                                imageUrl: event.target.value,
                              })
                            }
                          >
                            <option value="">Use main image</option>
                            {editor.imageUrls?.map((url, index) => (
                              <option value={url} key={url}>
                                {index === 0
                                  ? 'Main image'
                                  : `Image ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Back image</span>
                          <select
                            value={colour.backImageUrl ?? ''}
                            onChange={(event) =>
                              updateColour(colour.id, {
                                backImageUrl: event.target.value,
                              })
                            }
                          >
                            <option value="">Use front image</option>
                            {colour.backImageUrl && !editor.imageUrls?.includes(colour.backImageUrl) && <option value={colour.backImageUrl}>Current back image</option>}
                            {editor.imageUrls?.map((url, index) => (
                              <option value={url} key={url}>
                                {index === 0
                                  ? 'Main image'
                                  : `Image ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Price in pounds (optional)</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={(editor.pricePence / 100).toFixed(2)}
                            value={
                              colour.pricePence === null
                                ? ''
                                : (colour.pricePence / 100).toFixed(2)
                            }
                            onChange={(event) =>
                              updateColour(colour.id, {
                                pricePence:
                                  event.target.value === ''
                                    ? null
                                    : Math.round(
                                        Number(event.target.value) * 100,
                                      ),
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          aria-label={`Remove ${colour.name || 'colour'}`}
                          onClick={() =>
                            patchEditor({
                              colours: editor.colours?.filter(
                                (item) => item.id !== colour.id,
                              ),
                            })
                          }
                        >
                          <Trash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="drawer-section">
                <div className="drawer-section-heading">
                  <div>
                    <h3>
                      {editor.category === 'Mugs' ? 'Stock' : 'Stock by size'}
                    </h3>
                    <p>
                      {editor.category === 'Mugs'
                        ? 'Mugs do not use clothing sizes.'
                        : 'Use − and +, or type the amount available.'}
                    </p>
                  </div>
                  <span>{totalAvailable(editor)} total</span>
                </div>
                {creating && editor.category !== 'Mugs' && (
                  <fieldset className="drawer-size-choice">
                    <legend>Choose available sizes</legend>
                    <div>
                      {DEFAULT_SIZES.map((size) => (
                        <label key={size}>
                          <input
                            type="checkbox"
                            checked={editor.variants.some(
                              (item) => item.size === size,
                            )}
                            onChange={() => toggleNewSize(size)}
                          />
                          <span>{size}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div className="drawer-stock-list">
                  {sortVariantsBySize(editor.variants).map((item) => (
                    <div
                      className={`drawer-stock-row ${item.available <= 3 ? 'is-low' : ''}`}
                      key={item.id}
                    >
                      <div>
                        {editor.category === 'Mugs' ? (
                          <strong>Quantity available</strong>
                        ) : (
                          <Input
                            aria-label="Size name"
                            value={item.size}
                            onChange={(event) =>
                              patchVariant(item.id, {
                                size: event.target.value,
                              })
                            }
                          />
                        )}
                        <small>
                          {item.reserved
                            ? `${item.reserved} reserved`
                            : item.sku}
                        </small>
                      </div>
                      <div className="drawer-stepper">
                        <button
                          type="button"
                          onClick={() => adjustStock(item, -1)}
                          disabled={item.stockOnHand <= item.reserved}
                        >
                          <Minus />
                        </button>
                        <Input
                          aria-label={`${editor.category === 'Mugs' ? 'Mug' : item.size} stock`}
                          type="number"
                          min={item.reserved}
                          value={item.stockOnHand}
                          onChange={(event) =>
                            patchVariant(item.id, {
                              stockOnHand: Math.max(
                                item.reserved,
                                Number(event.target.value) || 0,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => adjustStock(item, 1)}
                        >
                          <Plus />
                        </button>
                      </div>
                      <strong>
                        {item.available <= 3
                          ? `Only ${item.available} left`
                          : `${item.available} available`}
                      </strong>
                    </div>
                  ))}
                </div>
                {editor.category !== 'Mugs' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      patchEditor({
                        variants: [
                          ...editor.variants,
                          makeVariant(
                            editor.id,
                            'New size',
                            editor.variants.length,
                            0,
                          ),
                        ],
                      })
                    }
                  >
                    <Plus /> Add another size
                  </Button>
                )}
              </section>
              <section className="drawer-section">
                <h3>Custom printing</h3>
                <label className="drawer-publish">
                  <input
                    type="checkbox"
                    checked={editor.customPrintingAvailable === true}
                    onChange={(event) =>
                      patchEditor({
                        customPrintingAvailable: event.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>
                      {editor.customPrintingAvailable
                        ? 'Custom printing offered'
                        : 'Custom printing not offered'}
                    </strong>
                    <small>
                      {editor.customPrintingAvailable
                        ? 'Shows the “Add custom printing from £2” link on this product.'
                        : 'Best for products that already have a finished design.'}
                    </small>
                  </span>
                </label>
                {editor.customPrintingAvailable && editor.category !== 'Mugs' && (
                  <div className="print-area-editor">
                    <p>Enter the measured printable torso area for each size. A4 and A3 previews use these centimetre measurements at true relative scale.</p>
                    {sortVariantsBySize(editor.variants).map((item) => (
                      <div className="print-area-row" key={item.id}>
                        <strong>{item.size}</strong>
                        <label>
                          Width (cm)
                          <Input
                            aria-label={`${item.size} printable width in centimetres`}
                            type="number"
                            min="30"
                            max="80"
                            step="0.1"
                            value={item.printAreaWidthCm ?? 40.4}
                            onChange={(event) => patchVariant(item.id, { printAreaWidthCm: Number(event.target.value) || 40.4 })}
                          />
                        </label>
                        <label>
                          Height (cm)
                          <Input
                            aria-label={`${item.size} printable height in centimetres`}
                            type="number"
                            min="43"
                            max="100"
                            step="0.1"
                            value={item.printAreaHeightCm ?? 65}
                            onChange={(event) => patchVariant(item.id, { printAreaHeightCm: Number(event.target.value) || 65 })}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="drawer-section">
                <h3>Shop visibility</h3>
                <label className="drawer-publish">
                  <input
                    type="checkbox"
                    checked={editor.active}
                    onChange={(event) =>
                      patchEditor({ active: event.target.checked })
                    }
                  />
                  <span>
                    <strong>
                      {editor.active ? 'Shown in shop' : 'Hidden from shop'}
                    </strong>
                    <small>
                      {editor.active
                        ? 'Customers can see and buy this product.'
                        : 'Customers cannot see this product yet.'}
                    </small>
                  </span>
                </label>
              </section>
              <footer className="drawer-actions">
                {!creating ? (
                  <details>
                    <summary>
                      Delete product <ChevronDown />
                    </summary>
                    <p>This permanently removes the product.</p>
                    <Button type="button" variant="outline" onClick={remove}>
                      <Trash2 /> Yes, delete it
                    </Button>
                  </details>
                ) : (
                  <span />
                )}
                <div>
                  <Button type="button" variant="outline" onClick={closeEditor}>
                    Cancel
                  </Button>
                  <Button
                    className="spectrum-primary"
                    type="submit"
                    disabled={saving}
                  >
                    <Save />{' '}
                    {saving
                      ? 'Saving…'
                      : creating
                        ? 'Add product'
                        : 'Save changes'}
                  </Button>
                </div>
              </footer>
            </form>
          </>
        )}
      </dialog>
    </main>
  );
}
