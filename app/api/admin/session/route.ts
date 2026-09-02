import { NextResponse } from 'next/server';
import { adminCookie, createAdminToken } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const token = await createAdminToken(body?.email ?? '', body?.password ?? '');
  if (!token) return NextResponse.json({ error: 'Email or password is incorrect, or admin login is not configured.' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: adminCookie.maxAge });
  return response;
}

export async function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.set(adminCookie.name, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 }); return response; }
