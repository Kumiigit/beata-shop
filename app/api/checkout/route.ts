import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/bootstrap';
import { createStripeCheckout } from '@/lib/stripe';
import type { CheckoutRequest } from '@/types/store';

type CheckoutLine = { variantId: string; productName: string; size: string; pricePence: number; quantity: number };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as CheckoutRequest | null;
  if (!body || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) return NextResponse.json({ error: 'Your bag is empty or invalid.' }, { status: 400 });
  const requested = new Map<string, number>();
  for (const item of body.items) {
    if (!item || typeof item.variantId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) return NextResponse.json({ error: 'A bag quantity is invalid.' }, { status: 400 });
    requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + item.quantity);
  }

  try {
    const db = await ensureDatabase();
    const lines: CheckoutLine[] = [];
    for (const [variantId, quantity] of requested) {
      const row = await db.prepare(`SELECT v.id AS variant_id, v.size, v.stock_on_hand, v.reserved, v.active AS variant_active, p.name AS product_name, p.price_pence, p.active AS product_active FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?`).bind(variantId).first<{ variant_id: string; size: string; stock_on_hand: number; reserved: number; variant_active: number; product_name: string; price_pence: number; product_active: number }>();
      if (!row || !row.variant_active || !row.product_active) return NextResponse.json({ error: 'One of these pieces is no longer available.' }, { status: 409 });
      if (row.stock_on_hand - row.reserved < quantity) return NextResponse.json({ error: `${row.product_name} in ${row.size} does not have enough stock.` }, { status: 409 });
      lines.push({ variantId, productName: row.product_name, size: row.size, pricePence: row.price_pence, quantity });
    }

    const orderId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 31 * 60 * 1000);
    const subtotal = lines.reduce((sum, line) => sum + line.pricePence * line.quantity, 0);
    const shipping = subtotal >= 6000 ? 0 : 495;
    const reserveResults = await db.batch(lines.map((line) => db.prepare('UPDATE variants SET reserved = reserved + ? WHERE id = ? AND active = 1 AND stock_on_hand - reserved >= ?').bind(line.quantity, line.variantId, line.quantity)));
    if (reserveResults.some((result) => (result.meta.changes ?? 0) !== 1)) {
      await db.batch(lines.map((line) => db.prepare('UPDATE variants SET reserved = MAX(reserved - ?, 0) WHERE id = ?').bind(line.quantity, line.variantId)));
      return NextResponse.json({ error: 'Stock changed while your bag was being checked. Please review it and try again.' }, { status: 409 });
    }

    await db.batch([
      db.prepare('INSERT INTO orders (id, stripe_session_id, status, customer_email, subtotal_pence, shipping_pence, total_pence, reservation_expires_at, created_at, updated_at) VALUES (?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?)').bind(orderId, 'reserving', subtotal, shipping, subtotal + shipping, expiresAt.toISOString(), now.toISOString(), now.toISOString()),
      ...lines.map((line) => db.prepare('INSERT INTO order_items (id, order_id, variant_id, product_name, size, unit_price_pence, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), orderId, line.variantId, line.productName, line.size, line.pricePence, line.quantity)),
    ]);

    const origin = new URL(request.url).origin;
    const params = new URLSearchParams();
    params.set('mode', 'payment'); params.set('locale', 'en-GB'); params.set('customer_creation', 'always'); params.set('client_reference_id', orderId); params.set('metadata[order_id]', orderId); params.set('payment_intent_data[metadata][order_id]', orderId);
    params.set('success_url', `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`); params.set('cancel_url', `${origin}/checkout/cancel`); params.set('expires_at', String(Math.floor(expiresAt.getTime() / 1000)));
    params.set('shipping_address_collection[allowed_countries][0]', 'GB');
    params.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount'); params.set('shipping_options[0][shipping_rate_data][display_name]', shipping ? 'Standard UK delivery' : 'Complimentary UK delivery'); params.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(shipping)); params.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'gbp'); params.set('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day'); params.set('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]', '3'); params.set('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day'); params.set('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]', '5');
    lines.forEach((line, index) => { params.set(`line_items[${index}][price_data][currency]`, 'gbp'); params.set(`line_items[${index}][price_data][unit_amount]`, String(line.pricePence)); params.set(`line_items[${index}][price_data][product_data][name]`, line.productName); params.set(`line_items[${index}][price_data][product_data][description]`, `Size ${line.size}`); params.set(`line_items[${index}][quantity]`, String(line.quantity)); });

    try {
      const session = await createStripeCheckout(params);
      await db.prepare('UPDATE orders SET stripe_session_id = ?, status = ?, updated_at = ? WHERE id = ?').bind(session.id, 'awaiting_payment', new Date().toISOString(), orderId).run();
      return NextResponse.json({ checkoutUrl: session.url, orderId });
    } catch (error) {
      await releaseOrder(db, orderId, lines, 'configuration_required');
      const message = error instanceof Error ? error.message : 'Checkout could not be created.';
      return NextResponse.json({ error: message }, { status: message.includes('not configured') ? 503 : 502 });
    }
  } catch {
    return NextResponse.json({ error: 'Checkout is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

async function releaseOrder(db: D1Database, orderId: string, lines: CheckoutLine[], status: string) {
  await db.batch([db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind(status, new Date().toISOString(), orderId), ...lines.map((line) => db.prepare('UPDATE variants SET reserved = MAX(reserved - ?, 0) WHERE id = ?').bind(line.quantity, line.variantId))]);
}
