import { getDatabase } from '../../lib/database';
import { getStore } from '@netlify/blobs';
import Stripe from 'stripe';

export const config = { schedule: '@hourly' };

async function customOrderMaintenance() {
  if (!process.env.DATABASE_URL || !process.env.STRIPE_SECRET_KEY) return new Response('Not configured', { status: 503 });
  const db = getDatabase(); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 }); let refunded = 0; let deleted = 0;
  const overdue = await db.sql<{ id: string; stripe_session_id: string }>`SELECT id,stripe_session_id FROM orders WHERE proof_cancel_at<=NOW() AND custom_status IN ('awaiting_approval','paused') AND status='paid'`;
  for (const order of overdue) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      if (!paymentIntent) continue;
      await stripe.refunds.create({ payment_intent: paymentIntent, metadata: { order_id: order.id, reason: 'proof_not_approved' } }, { idempotencyKey: `beata-proof-refund-${order.id}` });
      await db.sql`UPDATE orders SET status='refunded',custom_status='cancelled_no_approval',updated_at=NOW() WHERE id=${order.id}`;
      await db.sql`UPDATE custom_artwork SET status='cancelled',delete_after=NOW()+INTERVAL '30 days' WHERE order_id=${order.id}`;
      refunded += 1;
    } catch (error) { console.error('Custom order refund failed', order.id, error instanceof Error ? error.message : 'Unknown error'); }
  }
  const dueFiles = await db.sql<{ id: string; storage_key: string }>`SELECT id,storage_key FROM custom_artwork WHERE delete_after<=NOW()`;
  const store = getStore('beata-custom-artwork');
  for (const file of dueFiles) {
    try { await store.delete(file.storage_key); await db.sql`DELETE FROM custom_artwork WHERE id=${file.id}`; deleted += 1; }
    catch (error) { console.error('Artwork deletion failed', file.id, error instanceof Error ? error.message : 'Unknown error'); }
  }
  return Response.json({ refunded, deleted });
}

export default customOrderMaintenance;
