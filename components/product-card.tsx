import type { Product } from '@/types/store';
import { formatGBP } from '@/types/store';
import { LogoPlaceholder } from './logo-placeholder';

export function ProductCard({ product }: { product: Product }) {
  const available = product.variants.some((variant) => variant.available > 0 && variant.active);
  return (
    <article className="product-card">
      <a href={`/shop/${product.slug}`}>
        <LogoPlaceholder label={product.name} />
        <div className="product-meta">
          <div><p>{product.category}</p><h3>{product.name}</h3></div>
          <span>{formatGBP(product.pricePence)}</span>
        </div>
        {product.featured && <span className="product-badge">Featured</span>}
        {!available && <span className="product-badge sold-out">Sold out</span>}
      </a>
    </article>
  );
}
