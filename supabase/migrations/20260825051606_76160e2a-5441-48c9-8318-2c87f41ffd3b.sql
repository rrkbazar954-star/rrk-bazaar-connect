CREATE POLICY "product media readable" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-media');
CREATE POLICY "product media upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media');
CREATE POLICY "product media update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-media' AND owner = auth.uid());
CREATE POLICY "product media delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-media' AND owner = auth.uid());