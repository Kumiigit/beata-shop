export function runtimeValue(name: 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET' | 'NEXT_PUBLIC_SITE_URL') { return process.env[name]; }
