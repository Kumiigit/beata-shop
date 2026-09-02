import { NextResponse } from 'next/server';
import { adminSession } from '@/lib/admin-auth';
import { deleteProduct, saveProduct } from '@/lib/catalog';
import type { Product } from '@/types/store';

async function authorised() { return Boolean(await adminSession()); }

export async function POST(request: Request) { return persist(request); }
export async function PUT(request: Request) { return persist(request); }
export async function DELETE(request: Request) { if (!(await authorised())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 }); const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 }); await deleteProduct(id); return NextResponse.json({ ok: true }); }

async function persist(request: Request) {
  if (!(await authorised())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { product?: Product } | null; const product = body?.product;
  if (!product || !valid(product)) return NextResponse.json({ error: 'Product details are invalid.' }, { status: 400 });
  try { await saveProduct(product); return NextResponse.json({ ok: true, product }); }
  catch { return NextResponse.json({ error: 'The product could not be saved.' }, { status: 500 }); }
}

function valid(product: Product) { return typeof product.id === 'string' && product.id.length > 0 && typeof product.slug === 'string' && product.slug.length > 0 && text(product.name, 120) && text(product.category, 80) && text(product.description, 1200) && Number.isInteger(product.pricePence) && product.pricePence >= 0 && product.pricePence <= 100000 && Array.isArray(product.details) && Array.isArray(product.variants) && product.variants.length > 0 && product.variants.every((variant) => text(variant.id, 160) && text(variant.sku, 100) && text(variant.size, 40) && Number.isInteger(variant.stockOnHand) && variant.stockOnHand >= variant.reserved && variant.stockOnHand <= 100000); }
function text(value: unknown, max: number) { return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max; }
