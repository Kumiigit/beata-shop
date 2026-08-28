'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Product } from '@/types/store';
import { formatGBP } from '@/types/store';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ProductCard } from './product-card';
import { LogoPlaceholder } from './logo-placeholder';

export function ShopClient({
  products,
  initialSort = 'featured',
  initialCategory = 'all',
}: {
  products: Product[];
  initialSort?: string;
  initialCategory?: string;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [size, setSize] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [maxPrice, setMaxPrice] = useState(5500);
  const [sort, setSort] = useState(initialSort);
  const categories = [...new Set(products.map((product) => product.category))];
  const sizes = [...new Set(products.flatMap((product) => product.variants.map((variant) => variant.size)))];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query))
      .filter((product) => category === 'all' || product.category === category)
      .filter((product) => size === 'all' || product.variants.some((variant) => variant.size === size && variant.available > 0))
      .filter((product) => availability === 'all' || product.variants.some((variant) => variant.available > 0))
      .filter((product) => product.pricePence <= maxPrice)
      .sort((a, b) => {
        if (sort === 'price-low') return a.pricePence - b.pricePence;
        if (sort === 'price-high') return b.pricePence - a.pricePence;
        if (sort === 'newest') return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        return Number(b.featured) - Number(a.featured);
      });
  }, [products, search, category, size, availability, maxPrice, sort]);

  function reset() {
    setSearch(''); setCategory('all'); setSize('all'); setAvailability('all'); setMaxPrice(5500); setSort('featured');
  }

  return (
    <div className="shop-surface">
      <aside className="filters" aria-label="Product filters">
        <div className="filter-search"><Search aria-hidden="true" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the collection" aria-label="Search products" /></div>
        <label>Category
          <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <NativeSelectOption value="all">All categories</NativeSelectOption>
            {categories.map((item) => <NativeSelectOption value={item} key={item}>{item}</NativeSelectOption>)}
          </NativeSelect>
        </label>
        <label>Size
          <NativeSelect value={size} onChange={(e) => setSize(e.target.value)}>
            <NativeSelectOption value="all">All sizes</NativeSelectOption>
            {sizes.map((item) => <NativeSelectOption value={item} key={item}>{item}</NativeSelectOption>)}
          </NativeSelect>
        </label>
        <label>Availability
          <NativeSelect value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <NativeSelectOption value="all">Show all</NativeSelectOption>
            <NativeSelectOption value="available">In stock</NativeSelectOption>
          </NativeSelect>
        </label>
        <label className="price-filter">Up to {formatGBP(maxPrice)}
          <input type="range" min="1600" max="5500" step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
        </label>
        <button className="filter-reset" type="button" onClick={reset}>Reset filters</button>
      </aside>
      <div className="shop-results">
        <div className="results-toolbar">
          <p>{filtered.length} {filtered.length === 1 ? 'favourite' : 'favourites'}</p>
          <label>Sort by
            <NativeSelect value={sort} onChange={(e) => setSort(e.target.value)}>
              <NativeSelectOption value="featured">Featured</NativeSelectOption>
              <NativeSelectOption value="newest">Newest</NativeSelectOption>
              <NativeSelectOption value="price-low">Price: low to high</NativeSelectOption>
              <NativeSelectOption value="price-high">Price: high to low</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
        {filtered.length ? (
          <div className="product-grid shop-grid">{filtered.map((product) => <ProductCard product={product} key={product.id} />)}</div>
        ) : (
          <div className="empty-state"><LogoPlaceholder label="No matching products" /><h2>Nothing quite matches.</h2><p>Try widening your filters or explore the full collection.</p><button className="button button-dark" type="button" onClick={reset}>Clear filters</button></div>
        )}
      </div>
    </div>
  );
}
