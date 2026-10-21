import 'server-only';
import { getDatabase } from '@/lib/database';

let schemaReady: Promise<void> | undefined;

/** Netlify hides production database credentials from the CLI, so the server applies this idempotent schema on first use. */
export function ensureAnalyticsSchema() {
  schemaReady ??= (async () => {
    const client = await getDatabase().pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(20260925, 1)');
      await client.query(`CREATE TABLE IF NOT EXISTS public.analytics_page_views (
        id uuid PRIMARY KEY,
        visitor_id uuid NOT NULL,
        session_id uuid NOT NULL,
        path text NOT NULL CHECK (length(path) BETWEEN 1 AND 200),
        started_at timestamptz NOT NULL DEFAULT now(),
        engaged_seconds integer NOT NULL DEFAULT 0 CHECK (engaged_seconds BETWEEN 0 AND 86400)
      )`);
      await client.query('CREATE INDEX IF NOT EXISTS analytics_page_views_started_at_idx ON public.analytics_page_views (started_at DESC)');
      await client.query('CREATE INDEX IF NOT EXISTS analytics_page_views_path_started_at_idx ON public.analytics_page_views (path, started_at DESC)');
      await client.query('ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  })().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}
