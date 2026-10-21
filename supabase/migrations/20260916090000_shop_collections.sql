CREATE TABLE IF NOT EXISTS public.shop_collections (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  product_ids jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Collections are accessed through the authenticated server, not the public API.
ALTER TABLE public.shop_collections ENABLE ROW LEVEL SECURITY;
