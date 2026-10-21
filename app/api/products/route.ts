import { NextResponse } from 'next/server';
import { listStorefrontProducts } from '@/lib/storefront-catalog';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const size = url.searchParams.get('size');
  const available = url.searchParams.get('available') === 'true';
  let products = await listStorefrontProducts();
  if (category) products = products.filter((product) => product.category === category);
  if (size) products = products.filter((product) => product.variants.some((variant) => variant.size === size && variant.available > 0));
  if (available) products = products.filter((product) => product.variants.some((variant) => variant.available > 0));
  return NextResponse.json({ products }, { headers: { 'cache-control': 'public, max-age=30' } });
}
