ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS opens_at time,
  ADD COLUMN IF NOT EXISTS closes_at time,
  ADD COLUMN IF NOT EXISTS delivery_radius_km numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_order_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_options text[] NOT NULL DEFAULT '{cod}'::text[],
  ADD COLUMN IF NOT EXISTS has_gst boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gst_number text;

DROP POLICY IF EXISTS "shop media read own" ON storage.objects;
CREATE POLICY "shop media read own" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'shop-media');

DROP POLICY IF EXISTS "shop media upload" ON storage.objects;
CREATE POLICY "shop media upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-media');

DROP POLICY IF EXISTS "shop media update" ON storage.objects;
CREATE POLICY "shop media update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'shop-media') WITH CHECK (bucket_id = 'shop-media');