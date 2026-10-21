'use client';
/* eslint-disable @next/next/no-img-element */
import { StoreImage } from './store-image';
import { useEffect, useState } from 'react';
import { HOMEPAGE_MEDIA_SLOTS, type HomepageMedia, type HomepageMediaKey } from '@/types/homepage-media';
import './admin-homepage-media.css';

export function AdminHomepageMedia() {
  const [media, setMedia] = useState<HomepageMedia>({});
  const [busy, setBusy] = useState<HomepageMediaKey | null>(null);
  const [message, setMessage] = useState('Loading homepage images…');
  useEffect(() => { fetch('/api/admin/homepage-media').then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setMedia(data.media); setMessage(''); }).catch(() => setMessage('Unable to load homepage images.')); }, []);
  async function save(slot: HomepageMediaKey, imageUrl: string | null) {
    const response = await fetch('/api/admin/homepage-media', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot, imageUrl }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    setMedia(data.media);
  }
  async function upload(slot: HomepageMediaKey, file?: File) {
    if (!file) return;
    setBusy(slot); setMessage(`Uploading ${file.name}…`);
    try {
      const form = new FormData(); form.append('image', file);
      const uploadResponse = await fetch('/api/admin/product-image', { method: 'POST', body: form });
      const uploadData = await uploadResponse.json(); if (!uploadResponse.ok) throw new Error(uploadData.error);
      await save(slot, uploadData.url); setMessage('Homepage image saved. The live homepage updates immediately.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setBusy(null); }
  }
  async function remove(slot: HomepageMediaKey) {
    setBusy(slot); setMessage('');
    try { await save(slot, null); setMessage('Image removed. The original placeholder will be shown.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not remove image.'); }
    finally { setBusy(null); }
  }
  return <section className="homepage-media-admin" id="homepage-images"><header><div><h2>Homepage images</h2><p>Replace the banners and picture tiles shown on the homepage.</p></div><a href="/" target="_blank" rel="noreferrer">View homepage</a></header><p ><output>{message}</output></p><div className="homepage-media-grid">{HOMEPAGE_MEDIA_SLOTS.map(slot => { const url = media[slot.key]; return <article key={slot.key}><div className="homepage-media-preview">{url ? <StoreImage src={url} alt={`${slot.label} preview`} width={400} height={300} sizes="(max-width: 760px) 50vw, 320px" /> : <span>No image yet</span>}</div><div><strong>{slot.label}</strong><small>{slot.help}</small></div><label className="homepage-media-upload">{busy === slot.key ? 'Uploading…' : url ? 'Replace image' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(busy)} onChange={event => { void upload(slot.key, event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>{url && !('defaultUrl' in slot && url === slot.defaultUrl) && <button type="button" disabled={Boolean(busy)} onClick={() => void remove(slot.key)}>Remove</button>}</article>; })}</div></section>;
}
