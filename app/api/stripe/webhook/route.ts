import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/bootstrap';
import { verifyStripeSignature } from '@/lib/stripe';

type StripeEvent = { id: string; type: string; data: { object: { id: string; payment_status?: string; customer_details?: { email?: string | null } } } };
type OrderRow = { id: string; status: string };
type ItemRow = { variant_id: string; quantity: number };

export async function POST(request: Request) {
  const payload = await request.text();
  if (!(await verifyStripeSignature(payload, request.headers.get('stripe-signature')))) return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  let event: StripeEvent;
  try { event = JSON.parse(payload) as StripeEvent; } catch { return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 }); }

  try {
    const db = await ensureDatabase();
    if (await db.prepare('SELECT id FROM webhook_events WHERE id = ?').bind(event.id).first()) return NextResponse.json({ received: true, duplicate: true });
    const session = event.data.object;
    if (event.type === 'checkout.session.completed' && session.payment_status && session.payment_status !== 'unpaid') await completeOrder(db, session.id, session.customer_details?.email ?? null);
    if (event.type === 'checkout.session.async_payment_succeeded') await completeOrder(db, session.id, session.customer_details?.email ?? null);
    if (event.type === 'checkout.session.expired') await releaseOrder(db, session.id, 'expired');
    if (event.type === 'checkout.session.async_payment_failed') await releaseOrder(db, session.id, 'payment_failed');
    await db.prepare('INSERT OR IGNORE INTO webhook_events (id, event_type, processed_at) VALUES (?, ?, ?)').bind(event.id, event.type, new Date().toISOString()).run();
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 }); }
}

async function completeOrder(db: D1Database, sessionId: string, email: string | null) {
  const order = await db.prepare('SELECT id, status FROM orders WHERE stripe_session_id = ?').bind(sessionId).first<OrderRow>();
  if (!order || order.status === 'paid') return;
  const updated = await db.prepare("UPDATE orders SET status = 'paid', customer_email = ?, updated_at = ? WHERE id = ? AND status IN ('awaiting_payment', 'reserving')").bind(email, new Date().toISOString(), order.id).run();
  if ((updated.meta.changes ?? 0) !== 1) return;
  const items = await db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?').bind(order.id).all<ItemRow>();
  if (items.results.length) await db.batch(items.results.map((item) => db.prepare('UPDATE variants SET stock_on_hand = MAX(stock_on_hand - ?, 0), reserved = MAX(reserved - ?, 0) WHERE id = ?').bind(item.quantity, item.quantity, item.variant_id)));
}

async function releaseOrder(db: D1Database, sessionId: string, status: string) {
  const order = await db.prepare('SELECT id, status FROM orders WHERE stripe_session_id = ?').bind(sessionId).first<OrderRow>();
  if (!order || !['awaiting_payment', 'reserving'].includes(order.status)) return;
  const updated = await db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status IN ('awaiting_payment', 'reserving')").bind(status, new Date().toISOString(), order.id).run();
  if ((updated.meta.changes ?? 0) !== 1) return;
  const items = await db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?').bind(order.id).all<ItemRow>();
  if (items.results.length) await db.batch(items.results.map((item) => db.prepare('UPDATE variants SET reserved = MAX(reserved - ?, 0) WHERE id = ?').bind(item.quantity, item.variant_id)));
}
