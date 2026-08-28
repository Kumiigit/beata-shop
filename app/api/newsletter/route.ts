import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/bootstrap';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
  try { const db = await ensureDatabase(); await db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email, created_at) VALUES (?, ?)').bind(email, new Date().toISOString()).run(); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: 'The list is temporarily unavailable.' }, { status: 503 }); }
}
