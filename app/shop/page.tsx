import type { Metadata } from 'next';
import { ShopClient } from '@/components/shop-client';
import { listProducts } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Shop', description: 'Shop funny text T-shirts, hoodies, sweatshirts and accessories from Beata Shop.' };
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ sort?: string; category?: string }> }) { const params = await searchParams; const products = await listProducts(); return <main className="shop-page"><header className="page-hero"><p className="eyebrow">The full collection</p><h1>Wear what you mean.</h1><p>Funny text, comfortable clothes, and useful accessories for moods that deserve their own merchandise.</p></header><ShopClient products={products} initialSort={params.sort} initialCategory={params.category} /></main>; }
