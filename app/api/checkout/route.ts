import { NextResponse } from 'next/server';
import { getDatabase } from '@netlify/database';
import { createStripeCheckout } from '@/lib/stripe';
import type { CheckoutRequest } from '@/types/store';

type CheckoutLine = { variantId: string; productName: string; size: string; pricePence: number; quantity: number };

export async function POST(request: Request) {
  if (!process.env.NETLIFY_DB_URL) return NextResponse.json({ error: 'Checkout needs Netlify Database. Run with Netlify Dev or connect the project on Netlify.' }, { status: 503 });
  const body = await request.json().catch(() => null) as CheckoutRequest | null;
  if (!body || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) return NextResponse.json({ error: 'Your bag is empty or invalid.' }, { status: 400 });
  const requested = new Map<string, number>();
  for (const item of body.items) { if (!item || typeof item.variantId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) return NextResponse.json({ error: 'A bag quantity is invalid.' }, { status: 400 }); requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + item.quantity); }
  const db = getDatabase(); const client = await db.pool.connect(); const lines: CheckoutLine[] = []; const orderId = crypto.randomUUID(); const now = new Date(); const expiresAt = new Date(now.getTime() + 31 * 60 * 1000);
  try {
    await client.query('BEGIN');
    for (const [variantId, quantity] of requested) {
      const result = await client.query('SELECT v.id AS variant_id, v.size, v.stock_on_hand, v.reserved, v.active AS variant_active, p.name AS product_name, p.price_pence, p.active AS product_active FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id = $1 FOR UPDATE', [variantId]); const row = result.rows[0];
      if (!row || !row.variant_active || !row.product_active) throw new Error('One of these products is no longer available.');
      if (row.stock_on_hand - row.reserved < quantity) throw new Error(`${row.product_name} in ${row.size} does not have enough stock.`);
      lines.push({ variantId, productName: row.product_name, size: row.size, pricePence: row.price_pence, quantity });
      await client.query('UPDATE variants SET reserved = reserved + $1 WHERE id = $2', [quantity, variantId]);
    }
    const subtotal = lines.reduce((sum, line) => sum + line.pricePence * line.quantity, 0); const shipping = subtotal >= 6000 ? 0 : 495;
    await client.query('INSERT INTO orders (id, stripe_session_id, status, customer_email, subtotal_pence, shipping_pence, total_pence, reservation_expires_at, created_at, updated_at) VALUES ($1,NULL,$2,NULL,$3,$4,$5,$6,$7,$7)', [orderId, 'reserving', subtotal, shipping, subtotal + shipping, expiresAt, now]);
    for (const line of lines) await client.query('INSERT INTO order_items (id, order_id, variant_id, product_name, size, unit_price_pence, quantity) VALUES ($1,$2,$3,$4,$5,$6,$7)', [crypto.randomUUID(), orderId, line.variantId, line.productName, line.size, line.pricePence, line.quantity]);
    await client.query('COMMIT');
    const origin = new URL(request.url).origin; const params = new URLSearchParams(); params.set('mode', 'payment'); params.set('locale', 'en-GB'); params.set('customer_creation', 'always'); params.set('client_reference_id', orderId); params.set('metadata[order_id]', orderId); params.set('payment_intent_data[metadata][order_id]', orderId); params.set('success_url', `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`); params.set('cancel_url', `${origin}/checkout/cancel`); params.set('expires_at', String(Math.floor(expiresAt.getTime() / 1000))); params.set('shipping_address_collection[allowed_countries][0]', 'GB'); params.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount'); params.set('shipping_options[0][shipping_rate_data][display_name]', shipping ? 'Standard UK delivery' : 'Complimentary UK delivery'); params.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(shipping)); params.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'gbp');
    lines.forEach((line, index) => { params.set(`line_items[${index}][price_data][currency]`, 'gbp'); params.set(`line_items[${index}][price_data][unit_amount]`, String(line.pricePence)); params.set(`line_items[${index}][price_data][product_data][name]`, line.productName); params.set(`line_items[${index}][price_data][product_data][description]`, `Size ${line.size}`); params.set(`line_items[${index}][quantity]`, String(line.quantity)); });
    try { const session = await createStripeCheckout(params); await db.sql`UPDATE orders SET stripe_session_id = ${session.id}, status = 'awaiting_payment', updated_at = NOW() WHERE id = ${orderId}`; return NextResponse.json({ checkoutUrl: session.url, orderId }); }
    catch (error) { await releaseOrder(orderId, lines, 'configuration_required'); return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout could not be created.' }, { status: 503 }); }
  } catch (error) { await client.query('ROLLBACK').catch(() => undefined); return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout is temporarily unavailable.' }, { status: 409 }); }
  finally { client.release(); }
}

async function releaseOrder(orderId: string, lines: CheckoutLine[], status: string) { const db = getDatabase(); const client = await db.pool.connect(); try { await client.query('BEGIN'); await client.query('UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2', [status, orderId]); for (const line of lines) await client.query('UPDATE variants SET reserved=GREATEST(reserved-$1,0) WHERE id=$2', [line.quantity, line.variantId]); await client.query('COMMIT'); } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } }
