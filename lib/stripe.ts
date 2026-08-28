import { runtimeValue } from './runtime';

export async function createStripeCheckout(body: URLSearchParams) {
  const key = runtimeValue('STRIPE_SECRET_KEY');
  if (!key) throw new Error('Stripe test mode is not configured yet. Add STRIPE_SECRET_KEY to enable checkout.');
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' }, body });
  const data = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !data.id || !data.url) throw new Error(data.error?.message ?? 'Stripe Checkout could not be created.');
  return { id: data.id, url: data.url };
}

export async function verifyStripeSignature(payload: string, signature: string | null) {
  const secret = runtimeValue('STRIPE_WEBHOOK_SECRET');
  if (!secret || !signature) return false;
  const fields = signature.split(',').map((value) => value.split('='));
  const timestamp = fields.find(([key]) => key === 't')?.[1];
  const signatures = fields.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const result = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((candidate) => constantTimeEqual(candidate, expected));
}

function constantTimeEqual(a: string, b: string) { if (a.length !== b.length) return false; let result = 0; for (let index = 0; index < a.length; index++) result |= a.charCodeAt(index) ^ b.charCodeAt(index); return result === 0; }
