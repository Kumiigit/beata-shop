import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Proof service unavailable.' }, { status: 503 });
  const { token } = await params; const db = getDatabase();
  const rows = await db.sql`SELECT id,proof_url,custom_status,proof_response_due_at,proof_cancel_at FROM orders WHERE approval_token=${token}`;
  const order = rows[0]; if (!order) return NextResponse.json({ error: 'Proof link not found.' }, { status: 404 });
  return NextResponse.json({ order: { reference: String(order.id).slice(0, 8).toUpperCase(), proofUrl: order.proof_url, status: order.custom_status, responseDueAt: order.proof_response_due_at, cancelAt: order.proof_cancel_at } });
}

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Proof service unavailable.' }, { status: 503 });
  const { token } = await params; const db = getDatabase();
  const result = await db.sql`UPDATE orders SET custom_status='approved',proof_approved_at=NOW(),updated_at=NOW() WHERE approval_token=${token} AND custom_status IN ('awaiting_approval','paused') AND proof_cancel_at > NOW() RETURNING id`;
  if (!result.length) return NextResponse.json({ error: 'This proof can no longer be approved online.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
