/** Netlify may forward requests with an internal URL rather than the custom domain. */
export function validAdminOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = new Set(['https://beata-shop.co']);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin); } catch { /* Invalid configuration must not widen access. */ }
  }
  if (process.env.NODE_ENV !== 'production') allowed.add(new URL(request.url).origin);
  return allowed.has(origin);
}
