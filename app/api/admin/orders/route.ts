import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { adminSession } from '@/lib/admin-auth';
import { refundStripeCheckout } from '@/lib/stripe';

async function authorised() { return Boolean(await adminSession()); }

export async function GET() {
  if (!(await authorised())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ orders: [] });
  const db = getDatabase();
  await db.sql`UPDATE orders SET custom_status='paused' WHERE custom_status='awaiting_approval' AND proof_response_due_at < NOW()`;
  const rows = await db.sql`SELECT o.id,o.stripe_session_id,o.status,o.customer_email,o.total_pence,o.custom_status,o.proof_url,o.proof_sent_at,o.proof_response_due_at,o.proof_cancel_at,o.proof_approved_at,o.completed_at,o.approval_token,o.created_at,i.product_name,i.size,i.quantity,i.artwork_json FROM orders o JOIN order_items i ON i.order_id=o.id WHERE i.custom_print=TRUE ORDER BY o.created_at DESC`;
  return NextResponse.json({ orders: rows });
}

export async function PUT(request: Request) {
  if (!(await authorised())) return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { orderId?: string; action?: string; proofUrl?: string } | null;
  if (!body?.orderId || !body.action || !process.env.DATABASE_URL) return NextResponse.json({ error: 'Invalid order update.' }, { status: 400 });
  const db = getDatabase();
  if (body.action === 'proof_sent') {
    let proofUrl: URL; try { proofUrl = new URL(body.proofUrl ?? ''); } catch { return NextResponse.json({ error: 'Enter a valid proof URL.' }, { status: 400 }); }
    if (proofUrl.protocol !== 'https:') return NextResponse.json({ error: 'The proof link must use HTTPS.' }, { status: 400 });
    await db.sql`UPDATE orders SET proof_url=${proofUrl.toString()},proof_sent_at=NOW(),proof_response_due_at=NOW()+INTERVAL '48 hours',proof_cancel_at=NOW()+INTERVAL '7 days',custom_status='awaiting_approval',updated_at=NOW() WHERE id=${body.orderId} AND status='paid'`;
  } else if (body.action === 'complete') {
    await db.sql`UPDATE orders SET custom_status='completed',completed_at=NOW(),updated_at=NOW() WHERE id=${body.orderId} AND custom_status='approved'`;
    await db.sql`UPDATE custom_artwork SET status='completed',delete_after=NOW()+INTERVAL '30 days' WHERE order_id=${body.orderId}`;
  } else if (body.action === 'cancel_refund') {
    const result = await db.sql<{ stripe_session_id: string; custom_status: string; proof_cancel_at: string }>`SELECT stripe_session_id,custom_status,proof_cancel_at FROM orders WHERE id=${body.orderId}`;
    const order = result[0]; if (!order?.stripe_session_id || !order.proof_cancel_at || new Date(order.proof_cancel_at) > new Date()) return NextResponse.json({ error: 'This order is not yet eligible for the seven-day cancellation.' }, { status: 409 });
    await refundStripeCheckout(order.stripe_session_id, body.orderId);
    await db.sql`UPDATE orders SET status='refunded',custom_status='cancelled_no_approval',updated_at=NOW() WHERE id=${body.orderId}`;
    await db.sql`UPDATE custom_artwork SET status='cancelled',delete_after=NOW()+INTERVAL '30 days' WHERE order_id=${body.orderId}`;
  } else return NextResponse.json({ error: 'Unknown order action.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
