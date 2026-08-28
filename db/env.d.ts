declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    OWNER_EMAIL?: string;
    NEXT_PUBLIC_SITE_URL?: string;
  }
}
