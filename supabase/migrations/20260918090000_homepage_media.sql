CREATE TABLE IF NOT EXISTS public.homepage_media (
  slot_key text PRIMARY KEY,
  image_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.homepage_media ENABLE ROW LEVEL SECURITY;
