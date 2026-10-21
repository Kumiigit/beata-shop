CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id uuid PRIMARY KEY,
  visitor_id uuid NOT NULL,
  session_id uuid NOT NULL,
  path text NOT NULL CHECK (length(path) BETWEEN 1 AND 200),
  started_at timestamptz NOT NULL DEFAULT now(),
  engaged_seconds integer NOT NULL DEFAULT 0 CHECK (engaged_seconds BETWEEN 0 AND 86400)
);

CREATE INDEX IF NOT EXISTS analytics_page_views_started_at_idx ON public.analytics_page_views (started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_page_views_path_started_at_idx ON public.analytics_page_views (path, started_at DESC);

ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
