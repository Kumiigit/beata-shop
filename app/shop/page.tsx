import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop-client';
import { listStorefrontProducts, listStorefrontCollections } from '@/lib/storefront-catalog';
import { getLanguage } from '@/lib/server-language';
import { isProductAudience } from '@/lib/product-audiences';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> { const pl = (await getLanguage()) === 'pl'; return { title: pl ? 'Sklep' : 'Shop', description: pl ? 'Kupuj zabawne T-shirty, bluzy i akcesoria z nadrukami od Beata Shop.' : 'Shop funny text T-shirts, hoodies, sweatshirts and accessories from Beata Shop.' }; }
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ sort?: string; category?: string; audience?: string; q?: string }> }) { const params = await searchParams; if (params.category === 'Workwear') redirect('/workwear'); const [products, collections, language] = await Promise.all([listStorefrontProducts(), listStorefrontCollections(), getLanguage()]); const pl = language === 'pl'; return <main className="shop-page"><header className="page-hero"><p className="eyebrow">{pl ? 'Pełna kolekcja' : 'The full collection'}</p><h1>{pl ? 'Noś to, co masz na myśli.' : 'Wear what you mean.'}</h1><p>{pl ? 'Zabawne teksty, wygodne ubrania i praktyczne dodatki dla nastrojów, które zasługują na własne gadżety.' : 'Funny text, comfortable clothes, and useful accessories for moods that deserve their own merchandise.'}</p></header><ShopClient products={products} collections={collections} initialSort={params.sort} initialAudience={isProductAudience(params.audience) ? params.audience : 'all'} initialSearch={params.q} /></main>; }
