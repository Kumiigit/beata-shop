import 'server-only';
import Stripe from 'stripe';
import { runtimeValue } from './runtime';

let client: Stripe | null = null;

function stripeClient() {
  const key = runtimeValue('STRIPE_SECRET_KEY');
  if (!key || (!key.startsWith('sk_') && !key.startsWith('rk_'))) throw new Error('Stripe checkout is not configured yet. Add a restricted or secret Stripe API key to enable checkout.');
  client ??= new Stripe(key, { maxNetworkRetries: 2 });
  return client;
}

export async function createStripeCheckout(params: Stripe.Checkout.SessionCreateParams, orderId: string) {
  const session = await stripeClient().checkout.sessions.create(params, { idempotencyKey: `beata-order-${orderId}` });
  if (!session.url) throw new Error('Stripe Checkout did not return a payment URL.');
  return { id: session.id, url: session.url };
}

export async function parseStripeEvent(payload: string, signature: string | null) {
  const secret = runtimeValue('STRIPE_WEBHOOK_SECRET');
  if (!secret || !secret.startsWith('whsec_') || !signature) throw new Error('Stripe webhook signature cannot be verified.');
  return stripeClient().webhooks.constructEventAsync(payload, signature, secret);
}

export async function refundStripeCheckout(sessionId: string, orderId: string) {
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntent) throw new Error('This order does not have a refundable payment.');
  return stripe.refunds.create({ payment_intent: paymentIntent, metadata: { order_id: orderId, reason: 'proof_not_approved' } }, { idempotencyKey: `beata-proof-refund-${orderId}` });
}

export type { Stripe };
