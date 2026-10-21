'use client';

import type { Product } from '@/types/store';
import { formatGBP } from '@/types/store';
import { ProductArtwork } from './product-artwork';
import { useLanguage } from './language-provider';
import { translateCategory } from '@/lib/i18n';

export function ProductCard({ product }: { product: Product }) {
  const language = useLanguage();
  const pl = language === 'pl';
  const available = product.variants.some((variant) => variant.available > 0 && variant.active);
  const oneSize = product.category === 'Mugs' || (product.variants.length === 1 && product.variants[0]?.size === 'One size');
  const prices = [product.pricePence, ...(product.colours ?? []).flatMap((colour) => colour.pricePence === null ? [] : [colour.pricePence])];
  const minimumPrice = Math.min(...prices);
  const maximumPrice = Math.max(...prices);
  const mainColour = product.colours?.[0];
  const frontImage = mainColour?.imageUrl || product.imageUrls?.[0];
  const backImage = mainColour?.backImageUrl;
  return (
    <article className="product-card">
      <a href={product.category === 'Workwear' ? '/workwear' : `/shop/${product.slug}`}>
        <ProductArtwork slug={product.slug} label={`${product.name} product artwork`} src={frontImage} secondarySrc={backImage} />
        <div className="product-meta">
          <div><p>{translateCategory(product.category, language)}</p><h3>{product.name}</h3>{product.category !== 'Workwear' && <small>{available ? oneSize ? (pl ? 'Dostępny' : 'In stock') : (pl ? 'Dostępny w kilku rozmiarach' : 'Available in multiple sizes') : (pl ? 'Obecnie niedostępny' : 'Currently unavailable')}</small>}</div>
          {product.category === 'Workwear' ? <span>{pl ? 'Zapytaj o wycenę' : 'Request a quote'}</span> : <span>{minimumPrice !== maximumPrice ? `${pl ? 'Od' : 'From'} ${formatGBP(minimumPrice)}` : formatGBP(minimumPrice)}<small>{pl ? '+ £3 dostawy InPost za zamówienie' : '+ £3 InPost delivery per order'}<br />{pl ? 'Darmowa dostawa od £60' : 'Free delivery over £60'}</small></span>}
        </div>
        {product.featured && <span className="product-badge">{pl ? 'Polecane' : 'Featured'}</span>}
        {!available && product.category !== 'Workwear' && <span className="product-badge sold-out">{pl ? 'Wyprzedane' : 'Sold out'}</span>}
      </a>
    </article>
  );
}
