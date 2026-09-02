import { NextResponse } from 'next/server';
import { getDatabase } from '@netlify/database';
import { verifyStripeSignature } from '@/lib/stripe';

type StripeEvent = { id: string; type: string; data: { object: { id: string; payment_status?: string; customer_details?: { email?: string | null } } } };
export async function POST(request: Request) {
  const payload = await request.text(); if (!(await verifyStripeSignature(payload, request.headers.get('stripe-signature')))) return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  if (!process.env.NETLIFY_DB_URL) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
  let event: StripeEvent; try { event = JSON.parse(payload) as StripeEvent; } catch { return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 }); }
  const db = getDatabase(); const client = await db.pool.connect();
  try {
    await client.query('BEGIN'); const duplicate = await client.query('SELECT id FROM webhook_events WHERE id=$1', [event.id]); if (duplicate.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ received: true, duplicate: true }); }
    const session = event.data.object; const orderResult = await client.query('SELECT id,status FROM orders WHERE stripe_session_id=$1 FOR UPDATE', [session.id]); const order = orderResult.rows[0];
    if (order && order.status !== 'paid') {
      const items = await client.query('SELECT variant_id,quantity FROM order_items WHERE order_id=$1', [order.id]);
      const paid = (event.type === 'checkout.session.completed' && session.payment_status !== 'unpaid') || event.type === 'checkout.session.async_payment_succeeded'; const released = event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed';
      if (paid && ['awaiting_payment', 'reserving'].includes(order.status)) { await client.query("UPDATE orders SET status='paid',customer_email=$1,updated_at=NOW() WHERE id=$2", [session.customer_details?.email ?? null, order.id]); for (const item of items.rows) await client.query('UPDATE variants SET stock_on_hand=GREATEST(stock_on_hand-$1,0),reserved=GREATEST(reserved-$1,0) WHERE id=$2', [item.quantity, item.variant_id]); }
      if (released && ['awaiting_payment', 'reserving'].includes(order.status)) { await client.query('UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2', [event.type.endsWith('expired') ? 'expired' : 'payment_failed', order.id]); for (const item of items.rows) await client.query('UPDATE variants SET reserved=GREATEST(reserved-$1,0) WHERE id=$2', [item.quantity, item.variant_id]); }
    }
    await client.query('INSERT INTO webhook_events (id,event_type,processed_at) VALUES ($1,$2,NOW()) ON CONFLICT (id) DO NOTHING', [event.id, event.type]); await client.query('COMMIT'); return NextResponse.json({ received: true });
  } catch { await client.query('ROLLBACK').catch(() => undefined); return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 }); }
  finally { client.release(); }
}
