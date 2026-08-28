import { env } from 'cloudflare:workers';

export function runtimeValue(name: 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET' | 'OWNER_EMAIL' | 'NEXT_PUBLIC_SITE_URL') {
  const workerValue = (env as unknown as Record<string, string | undefined>)[name];
  return workerValue || process.env[name];
}
