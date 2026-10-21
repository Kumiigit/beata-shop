'use client';
import { useState } from 'react';
import type { Product } from '@/types/store';
import type { ProductCollection } from '@/types/collection';

type Backup = { products: Product[]; collections: ProductCollection[]; images: Record<string, { base64: string; type: string }> };
export function AdminImport() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const data = JSON.parse(await file.text()) as Backup;
      if (!Array.isArray(data.products) || !data.images || !Array.isArray(data.collections)) throw new Error('Invalid inventory backup.');
      const images = new Map<string, string>();
      let added = 0, skipped = 0;
      for (const source of data.products) {
        setMessage(`Importing ${source.name}…`);
        const product = structuredClone(source);
        const urls = [...new Set([...(product.imageUrls ?? []), ...(product.colours ?? []).map(c => c.imageUrl)].filter(Boolean))];
        for (const url of urls) {
          if (images.has(url)) continue;
          const image = data.images[url];
          if (!image) throw new Error('Backup is missing a product photo.');
          const bytes = Uint8Array.from(atob(image.base64), c => c.charCodeAt(0));
          const form = new FormData(); form.append('image', new Blob([bytes], { type: image.type }), 'product.png');
          const response = await fetch('/api/admin/product-image', { method: 'POST', body: form });
          const result = await response.json(); if (!response.ok) throw new Error(result.error);
          images.set(url, result.url);
        }
        product.imageUrls = (product.imageUrls ?? []).map(url => images.get(url)!);
        product.colours = (product.colours ?? []).map(c => ({ ...c, imageUrl: c.imageUrl ? images.get(c.imageUrl)! : '' }));
        const response = await fetch('/api/admin/import-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product }) });
        const result = await response.json();
        if (response.status === 409) { skipped++; continue; }
        if (!response.ok) throw new Error(result.error);
        added++;
      }
      const existingResponse = await fetch('/api/admin/collections');
      if (!existingResponse.ok) throw new Error('Could not check existing collections. Products were imported.');
      const existing = await existingResponse.json();
      for (const collection of data.collections) {
        if (existing.collections.some((c: ProductCollection) => c.id === collection.id)) continue;
        const response = await fetch('/api/admin/collections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collection) });
        if (!response.ok) { const result = await response.json(); throw new Error(result.error); }
      }
      setMessage(`Import complete: ${added} products added, ${skipped} existing products kept. Collections imported. Refresh to see them.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import failed.'); }
    finally { setBusy(false); }
  }
  return <details className="collection-admin"><summary>Import saved inventory</summary><p>Add products, photos and collections from a backup. Existing products are never overwritten.</p><input type="file" accept="application/json,.json" aria-label="Inventory backup" disabled={busy} onChange={e => void importFile(e.target.files?.[0])} /><p ><output>{message}</output></p></details>;
}
