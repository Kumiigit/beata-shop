import type { CSSProperties } from 'react';
import { getProductArtworkIndex } from '@/data/products';

export function ProductArtwork({ slug, label, className = '' }: { slug: string; label: string; className?: string }) {
  const index = getProductArtworkIndex(slug);
  const column = index % 4;
  const row = Math.floor(index / 4);
  return <div className={`product-artwork ${className}`} role="img" aria-label={label}><img src="/cat-products.png" alt="" aria-hidden="true" style={{ left: `${column * -100}%`, top: `${row * -100}%` } as CSSProperties} /></div>;
}
