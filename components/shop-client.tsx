'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { Product } from '@/types/store';
import { formatGBP } from '@/types/store';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ProductCard } from './product-card';
import { LogoPlaceholder } from './logo-placeholder';
import type { ProductCollection } from '@/types/collection';
import './collections.css';
import './workwear.css';
import { useLanguage } from './language-provider';
import { translateCategory, translateSize } from '@/lib/i18n';
import { listProductCategories } from '@/lib/product-categories';
import { isProductAudience, matchesProductAudience, PRODUCT_AUDIENCES, type ProductAudience } from '@/lib/product-audiences';

export function ShopClient({
  products,
  collections = [],
  initialSort = 'featured',
  initialAudience = 'all',
  initialSearch = '',
}: {
  products: Product[];
  collections?: ProductCollection[];
  initialSort?: string;
  initialAudience?: ProductAudience | 'all';
  initialSearch?: string;
}) {
  const language = useLanguage();
  const pl = language === 'pl';
  const [search, setSearch] = useState(initialSearch);
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? 'all';
  const [audience, setAudience] = useState<ProductAudience | 'all'>(initialAudience);
  const [size, setSize] = useState('all');
  const [availability, setAvailability] = useState('all');
  const priceCeiling = Math.max(5500, ...products.map((product) => product.pricePence));
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  const [sort, setSort] = useState(initialSort);
  const categories = listProductCategories(products);
  const sizes = [...new Set(products.flatMap((product) => product.variants.map((variant) => variant.size)))];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => product.category !== 'Workwear')
      .filter((product) => !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query))
      .filter((product) => category === 'all' || product.category === category)
      .filter((product) => matchesProductAudience(product.audiences, audience))
      .filter((product) => size === 'all' || product.variants.some((variant) => variant.size === size && variant.available > 0))
      .filter((product) => availability === 'all' || product.variants.some((variant) => variant.available > 0))
      .filter((product) => product.pricePence <= maxPrice)
      .sort((a, b) => {
        if (sort === 'price-low') return a.pricePence - b.pricePence;
        if (sort === 'price-high') return b.pricePence - a.pricePence;
        if (sort === 'newest') return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        return Number(b.featured) - Number(a.featured);
      });
  }, [products, search, category, audience, size, availability, maxPrice, sort]);

  function setCategory(nextCategory: string) {
    const url = new URL(window.location.href);
    if (nextCategory === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', nextCategory);
    // Keep the current catalogue entry filtered when browser Back restores it.
    window.history.replaceState(null, '', url.toString());
  }

  function reset() {
    setSearch(''); setCategory('all'); setAudience('all'); setSize('all'); setAvailability('all'); setMaxPrice(priceCeiling); setSort('featured');
  }

  return (
    <div className="shop-surface">
      <aside className="filters" aria-label={pl ? 'Filtry produktów' : 'Product filters'}>
        <div className="filter-search"><Search aria-hidden="true" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={pl ? 'Przeszukaj kolekcję' : 'Search the collection'} aria-label={pl ? 'Szukaj produktów' : 'Search products'} /></div>
        <label>{pl ? 'Kategoria' : 'Category'}
          <NativeSelect value={category} onChange={(e) => { if (e.target.value === 'Workwear') window.location.assign('/workwear'); else setCategory(e.target.value); }}>
            <NativeSelectOption value="all">{pl ? 'Wszystkie kategorie' : 'All categories'}</NativeSelectOption>
            {categories.map((item) => <NativeSelectOption value={item} key={item}>{translateCategory(item, language)}</NativeSelectOption>)}
          </NativeSelect>
        </label>
        <label>{pl ? 'Dla kogo' : 'Shop for'}
          <NativeSelect value={audience} onChange={(e) => setAudience(isProductAudience(e.target.value) ? e.target.value : 'all')}>
            <NativeSelectOption value="all">{pl ? 'Wszyscy' : 'Everyone'}</NativeSelectOption>
            {PRODUCT_AUDIENCES.map((item) => <NativeSelectOption value={item} key={item}>{item === 'women' ? (pl ? 'Kobiety' : 'Women') : item === 'men' ? (pl ? 'Mężczyźni' : 'Men') : (pl ? 'Dzieci' : 'Kids')}</NativeSelectOption>)}
          </NativeSelect>
        </label>
        <label>{pl ? 'Rozmiar' : 'Size'}
          <NativeSelect value={size} onChange={(e) => setSize(e.target.value)}>
            <NativeSelectOption value="all">{pl ? 'Wszystkie rozmiary' : 'All sizes'}</NativeSelectOption>
            {sizes.map((item) => <NativeSelectOption value={item} key={item}>{translateSize(item, language)}</NativeSelectOption>)}
          </NativeSelect>
        </label>
        <label>{pl ? 'Dostępność' : 'Availability'}
          <NativeSelect value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <NativeSelectOption value="all">{pl ? 'Pokaż wszystkie' : 'Show all'}</NativeSelectOption>
            <NativeSelectOption value="available">{pl ? 'Dostępne' : 'In stock'}</NativeSelectOption>
          </NativeSelect>
        </label>
        <label className="price-filter">{pl ? 'Do' : 'Up to'} {formatGBP(maxPrice)}
          <input type="range" min="1600" max={priceCeiling} step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
        </label>
        <button className="filter-reset" type="button" onClick={reset}>{pl ? 'Wyczyść filtry' : 'Reset filters'}</button>
      </aside>
      <div className="shop-results">
        {category === 'all' && <Link className="workwear-shop-link" href="/workwear"><strong>{pl ? 'Odzież robocza z Twoim logo' : 'Workwear with your logo'}</strong><span>{pl ? 'Czapki, odzież odblaskowa, koszulki polo i bezrękawniki. Logo HTV lub haft i indywidualna wycena →' : 'Caps, hi-vis workwear, polos and gilets. HTV or embroidery and a quote for your team →'}</span></Link>}
        <div className="results-toolbar">
          <p>{filtered.length} {pl ? (filtered.length === 1 ? 'produkt' : 'produktów') : (filtered.length === 1 ? 'favourite' : 'favourites')}</p>
          <label>{pl ? 'Sortuj według' : 'Sort by'}
            <NativeSelect value={sort} onChange={(e) => setSort(e.target.value)}>
              <NativeSelectOption value="featured">{pl ? 'Polecane' : 'Featured'}</NativeSelectOption>
              <NativeSelectOption value="newest">{pl ? 'Najnowsze' : 'Newest'}</NativeSelectOption>
              <NativeSelectOption value="price-low">{pl ? 'Cena: od najniższej' : 'Price: low to high'}</NativeSelectOption>
              <NativeSelectOption value="price-high">{pl ? 'Cena: od najwyższej' : 'Price: high to low'}</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
        {filtered.length ? (
          <div>{[...new Set(filtered.map(p => p.category))].map(categoryName => {
            const categoryProducts = filtered.filter(p => p.category === categoryName);
            const groups = collections.filter(c => c.category === categoryName).map(c => ({ ...c, products: categoryProducts.filter(p => c.productIds.includes(p.id)) })).filter(c => c.products.length);
            const groupedIds = new Set(groups.flatMap(c => c.products.map(p => p.id)));
            const otherProducts = categoryProducts.filter(p => !groupedIds.has(p.id));
            return <section className="catalogue-category" key={categoryName}><h2>{translateCategory(categoryName, language)}</h2>
              {groups.map(group => <section className="catalogue-collection" key={group.id}><h3>{group.name}</h3><div className="product-grid shop-grid">{group.products.map(product => <ProductCard product={product} key={product.id} />)}</div></section>)}
              {!!otherProducts.length && <section className="catalogue-collection">{!!groups.length && <h3>{pl ? `Więcej: ${translateCategory(categoryName, language).toLowerCase()}` : `More ${categoryName.toLowerCase()}`}</h3>}<div className="product-grid shop-grid">{otherProducts.map(product => <ProductCard product={product} key={product.id} />)}</div></section>}
            </section>;
          })}</div>
        ) : (
          <div className="empty-state"><LogoPlaceholder label={pl ? 'Brak pasujących produktów' : 'No matching products'} /><h2>{pl ? 'Brak pasujących produktów.' : 'Nothing quite matches.'}</h2><p>{pl ? 'Zmień filtry lub przejrzyj całą kolekcję.' : 'Try widening your filters or explore the full collection.'}</p><button className="button button-dark" type="button" onClick={reset}>{pl ? 'Wyczyść filtry' : 'Clear filters'}</button></div>
        )}
      </div>
    </div>
  );
}
