import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'beata_admin';
const MAX_AGE = 60 * 60 * 8;
const devEmail = 'admin@beata-shop.co';
const devPassword = 'beata-local-admin';

function credentials() {
  return { email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || (process.env.NODE_ENV !== 'production' ? devEmail : ''), password: process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? devPassword : ''), secret: process.env.SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? 'beata-development-session-secret-change-in-production' : '') };
}

function same(a: string, b: string) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); }
function sign(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('base64url'); }

export async function createAdminToken(email: string, password: string) {
  const configured = credentials();
  if (!configured.email || !configured.password || !configured.secret || !same(email.trim().toLowerCase(), configured.email) || !same(password, configured.password)) return null;
  const payload = Buffer.from(JSON.stringify({ email: configured.email, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload, configured.secret)}`;
}

export async function adminSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  const configured = credentials();
  if (!token || !configured.secret) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !same(signature, sign(payload, configured.secret))) return null;
  try { const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email: string; exp: number }; return parsed.exp > Date.now() && parsed.email === configured.email ? parsed : null; } catch { return null; }
}

export const adminCookie = { name: COOKIE, maxAge: MAX_AGE };
