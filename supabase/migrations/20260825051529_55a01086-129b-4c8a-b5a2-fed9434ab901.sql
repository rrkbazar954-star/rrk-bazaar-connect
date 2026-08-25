ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS colors text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS upi_id text;