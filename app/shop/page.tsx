import type { Metadata } from 'next';
import { seedProducts } from '@/data/products';
import { ShopClient } from '@/components/shop-client';
export const metadata: Metadata = { title: 'Shop', description: 'Explore original cat-themed clothing, homeware, gifts and accessories from Beata Shop.' };
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ sort?: string; category?: string }> }) { const params = await searchParams; return <main className="shop-page"><header className="page-hero"><p className="eyebrow">Everything in cats</p><h1>Made for cat people.</h1><p>Original clothing, characterful homeware, and thoughtful gifts for lives happily ruled by cats.</p></header><ShopClient products={seedProducts.filter((p) => p.active)} initialSort={params.sort} initialCategory={params.category} /></main>; }
