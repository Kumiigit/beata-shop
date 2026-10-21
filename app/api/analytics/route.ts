import { cookies } from 'next/headers';
import { getDatabase } from '@/lib/database';
import { ensureAnalyticsSchema } from '@/lib/analytics-db';
import { validAdminOrigin } from '@/lib/admin-origin';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!validAdminOrigin(request)) return new Response(null, { status: 403 });
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('beata_analytics_visitor')?.value;
  if (cookieStore.get('beata_analytics_consent')?.value !== 'yes' || !visitorId || !uuid.test(visitorId)) return new Response(null, { status: 403 });
  if (!process.env.DATABASE_URL) return new Response(null, { status: 503 });

  const body = await request.json().catch(() => null) as { viewId?: unknown; sessionId?: unknown; path?: unknown; seconds?: unknown } | null;
  const path = body?.path;
  if (!body || typeof body.viewId !== 'string' || !uuid.test(body.viewId) || typeof body.sessionId !== 'string' || !uuid.test(body.sessionId) || typeof path !== 'string' || !/^\/(?!\/)[a-z0-9/-]*$/i.test(path) || path.length > 200 || /^\/(admin|api|proof)(\/|$)/.test(path) || typeof body.seconds !== 'number' || !Number.isInteger(body.seconds) || body.seconds < 0 || body.seconds > 86400) return new Response(null, { status: 400 });

  try {
    await ensureAnalyticsSchema();
    await getDatabase().sql`INSERT INTO public.analytics_page_views (id, visitor_id, session_id, path, engaged_seconds)
      VALUES (${body.viewId}, ${visitorId}, ${body.sessionId}, ${path}, ${body.seconds})
      ON CONFLICT (id) DO UPDATE SET engaged_seconds = GREATEST(analytics_page_views.engaged_seconds, EXCLUDED.engaged_seconds)
      WHERE analytics_page_views.visitor_id = EXCLUDED.visitor_id AND analytics_page_views.session_id = EXCLUDED.session_id`;
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Analytics collection failed:', error);
    return new Response(null, { status: 503 });
  }
}
