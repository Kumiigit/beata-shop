'use client';

import { useState } from 'react';
import type { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminPanel({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  function updateProduct(id: string, patch: Partial<Product>) { setProducts((current) => current.map((product) => product.id === id ? { ...product, ...patch } : product)); }
  function updateStock(productId: string, variantId: string, stockOnHand: number) { setProducts((current) => current.map((product) => product.id === productId ? { ...product, variants: product.variants.map((variant) => variant.id === variantId ? { ...variant, stockOnHand, available: Math.max(stockOnHand - variant.reserved, 0) } : variant) } : product)); }

  async function save(product: Product) {
    setSaving(product.id); setStatus('');
    const response = await fetch('/api/admin/products', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ product }) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setStatus(response.ok ? `${product.name} was saved.` : data.error ?? 'The product could not be saved.');
    setSaving(null);
  }

  return <div className="admin-products">
    <div className="admin-note"><strong>Stripe handles payments, refunds, and fulfilment.</strong><span>This page manages the catalogue, visible products, sizes, and sellable stock.</span></div>
    <p className="admin-status" aria-live="polite">{status}</p>
    {products.map((product) => <section className="admin-product" key={product.id}>
      <div className="admin-product-heading"><div><p>{product.category}</p><h2>{product.name}</h2></div><label className="toggle-label"><input type="checkbox" checked={product.active} onChange={(e) => updateProduct(product.id, { active: e.target.checked })} /> Visible in shop</label></div>
      <div className="admin-fields">
        <label>Name<Input value={product.name} onChange={(e) => updateProduct(product.id, { name: e.target.value })} /></label>
        <label>Category<Input value={product.category} onChange={(e) => updateProduct(product.id, { category: e.target.value })} /></label>
        <label>Price in pence<Input type="number" min="0" value={product.pricePence} onChange={(e) => updateProduct(product.id, { pricePence: Number(e.target.value) })} /></label>
        <label className="wide-field">Description<textarea value={product.description} onChange={(e) => updateProduct(product.id, { description: e.target.value })} /></label>
      </div>
      <div className="variant-table"><div className="variant-row variant-head"><span>Size</span><span>SKU</span><span>Reserved</span><span>Stock</span></div>{product.variants.map((variant) => <div className="variant-row" key={variant.id}><strong>{variant.size}</strong><span>{variant.sku}</span><span>{variant.reserved}</span><Input aria-label={`${product.name} ${variant.size} stock`} type="number" min={variant.reserved} value={variant.stockOnHand} onChange={(e) => updateStock(product.id, variant.id, Number(e.target.value))} /></div>)}</div>
      <Button className="shop-button admin-save" onClick={() => save(product)} disabled={saving === product.id}>{saving === product.id ? 'Saving…' : 'Save product'}</Button>
    </section>)}
  </div>;
}
