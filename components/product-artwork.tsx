'use client';

import { ImageIcon } from 'lucide-react';
import { useLanguage } from './language-provider';
import { StoreImage } from './store-image';

function displayText(label: string) { return label.replace(/\b(Tee|Hoodie|Sweatshirt|Cap|Tote|Long Sleeve)\b/gi, '').trim(); }

export function ProductArtwork({ slug, label, className = '', src, secondarySrc, sizes = '(max-width: 540px) 100vw, (max-width: 900px) 50vw, 25vw', loading = 'lazy' }: { slug: string; label: string; className?: string; src?: string; secondarySrc?: string; sizes?: string; loading?: 'lazy' | 'eager' }) {
  const pl = useLanguage() === 'pl';
  const kind = /hoodie/i.test(slug) ? 'hoodie' : /sweatshirt|long-sleeve/i.test(slug) ? 'sweatshirt' : /cap|tote|accessor/i.test(slug) ? 'accessory' : 'tee';
  if (src && secondarySrc) return <div className={`product-artwork product-photo product-photo-pair ${className}`}><StoreImage src={src} alt={`${label} — ${pl ? 'przód' : 'front'}`} width={400} height={600} sizes="(max-width: 540px) 50vw, (max-width: 900px) 25vw, 12vw" loading={loading} /><StoreImage src={secondarySrc} alt={`${label} — ${pl ? 'tył' : 'back'}`} width={400} height={600} sizes="(max-width: 540px) 50vw, (max-width: 900px) 25vw, 12vw" loading={loading} /></div>;
  if (src) return <div className={`product-artwork product-photo ${className}`}><StoreImage src={src} alt={label} width={800} height={1000} sizes={sizes} loading={loading} /></div>;
  return <figure style={{ margin: 0 }} className={`product-artwork shop-image-placeholder placeholder-${kind} ${className}`}  aria-label={`${label} — ${pl ? 'miejsce na zdjęcie produktu' : 'product image placeholder'}`}><ImageIcon aria-hidden="true" /><span>{pl ? 'Zdjęcie produktu' : 'Product image'}</span><strong>{displayText(label)}</strong></figure>;
}
