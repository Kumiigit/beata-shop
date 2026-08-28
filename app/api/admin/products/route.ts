import { NextResponse } from 'next/server';
import { ownerStatus } from '@/lib/admin';
import { ensureDatabase } from '@/db/bootstrap';
import type { Product } from '@/types/store';

export async function PUT(request: Request) {
  const owner = await ownerStatus();
  if (!owner.ok) return NextResponse.json({ error: owner.reason }, { status: owner.status });
  const body = await request.json().catch(() => null) as { product?: Product } | null;
  const product = body?.product;
  if (!product || typeof product.id !== 'string' || !validText(product.name, 120) || !validText(product.category, 80) || !validText(product.description, 1000) || !Number.isInteger(product.pricePence) || product.pricePence < 0 || product.pricePence > 100000 || !Array.isArray(product.variants)) return NextResponse.json({ error: 'Product details are invalid.' }, { status: 400 });
  if (product.variants.some((variant) => !variant.id || !Number.isInteger(variant.stockOnHand) || variant.stockOnHand < variant.reserved || variant.stockOnHand > 100000)) return NextResponse.json({ error: 'Variant stock is invalid or below the reserved quantity.' }, { status: 400 });
  try {
    const db = await ensureDatabase();
    await db.batch([
      db.prepare('UPDATE products SET name = ?, description = ?, category = ?, price_pence = ?, active = ?, featured = ?, updated_at = ? WHERE id = ?').bind(product.name.trim(), product.description.trim(), product.category.trim(), product.pricePence, product.active ? 1 : 0, product.featured ? 1 : 0, new Date().toISOString(), product.id),
      ...product.variants.map((variant) => db.prepare('UPDATE variants SET stock_on_hand = ?, active = ? WHERE id = ? AND product_id = ?').bind(variant.stockOnHand, variant.active ? 1 : 0, variant.id, product.id)),
    ]);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'The product could not be saved.' }, { status: 500 }); }
}

function validText(value: unknown, max: number) { return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max; }
