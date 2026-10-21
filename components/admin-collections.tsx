'use client';
/* eslint-disable @next/next/no-img-element */
import { StoreImage } from './store-image';
import { useEffect, useState } from 'react';
import type { Product } from '@/types/store';
import type { ProductCollection } from '@/types/collection';
import './collections.css';

export function AdminCollections({ products }: { products: Product[] }) {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [draft, setDraft] = useState<ProductCollection | null>(null);
  const [message, setMessage] = useState('Loading collections…');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const categories = [...new Set(products.map(p => p.category))];
  useEffect(() => { fetch('/api/admin/collections').then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error); setCollections(data.collections); setMessage(''); }).catch(() => setMessage('Unable to load collections. Refresh to try again.')); }, []);
  async function persist(remove = false) {
    if (!draft || (remove && !confirm('Delete this collection? The products will not be deleted.'))) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/collections${remove ? `?id=${encodeURIComponent(draft.id)}` : ''}`, { method: remove ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: remove ? undefined : JSON.stringify(draft) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setCollections(data.collections); setDraft(null); setMessage(remove ? 'Collection deleted. Products kept.' : 'Collection saved. It will appear first in its catalogue category.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className="collection-admin" id="collections">
    <div className="collection-heading"><div><h2>Collections</h2><p>Group products together and show them first in their category.</p></div><button type="button" disabled={busy || !categories.length} onClick={() => { setDraft({ id: crypto.randomUUID(), name: '', category: categories[0], productIds: [] }); setQuery(''); }}>New collection</button></div>
    <p ><output>{message}</output></p>
    {!collections.length && !draft && <p>No collections yet. Create one and tick the products you want to include.</p>}
    <div className="collection-list">{collections.map(c => <button type="button" key={c.id} disabled={busy} onClick={() => { setDraft({ ...c, productIds: c.productIds.filter(id => products.some(p => p.id === id && p.category === c.category)) }); setQuery(''); }}><strong>{c.name}</strong><span>{c.category} · {c.productIds.filter(id => products.some(p => p.id === id && p.category === c.category)).length} products · Edit</span></button>)}</div>
    {draft && <form className="collection-editor" onSubmit={e => { e.preventDefault(); void persist(); }}><fieldset disabled={busy}>
      <div className="collection-fields"><label>Collection name<input required maxLength={80} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Funny mugs" /></label><label>Show in catalogue category<select value={draft.category} onChange={e => { if (!draft.productIds.length || confirm('Changing category clears the selected products. Continue?')) setDraft({ ...draft, category: e.target.value, productIds: [] }); }}>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
      <p>Tick to add; untick to remove. Hidden products stay hidden in the shop. Empty collections are not displayed.</p>
      <label>Find products<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by product name" /></label>
      <p>{draft.productIds.length} products selected</p>
      <div className="collection-picker">{products.filter(p => p.category === draft.category && p.name.toLowerCase().includes(query.toLowerCase())).map(p => <label key={p.id}><input type="checkbox" checked={draft.productIds.includes(p.id)} onChange={e => setDraft({ ...draft, productIds: e.target.checked ? [...draft.productIds, p.id] : draft.productIds.filter(id => id !== p.id) })} />{p.imageUrls?.[0] && <StoreImage src={p.imageUrls[0]} alt="" width={48} height={48} sizes="48px" />}<span>{p.name}{!p.active && <small>Hidden from shop</small>}</span></label>)}</div>
      <div className="collection-actions"><button type="submit">{busy ? 'Saving…' : 'Save collection'}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button>{collections.some(c => c.id === draft.id) && <button type="button" onClick={() => void persist(true)}>Delete collection</button>}</div>
    </fieldset></form>}
  </section>;
}
