import type { Metadata } from 'next';
import { seedProducts } from '@/data/products';
import { ShopClient } from '@/components/shop-client';

export const metadata: Metadata = { title: 'Shop', description: 'Explore Beata Shop unisex essentials in sizes XS to XXL.' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const params = await searchParams;
  return <main className="shop-page"><header className="page-hero"><p className="eyebrow">The full collection</p><h1>Everyday, considered.</h1><p>Eight dependable pieces, designed to layer, repeat, and live in.</p></header><ShopClient products={seedProducts.filter((p) => p.active)} initialSort={params.sort} /></main>;
}
