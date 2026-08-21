-- split public-read policies so anon path never calls helper functions
DROP POLICY "active shops public" ON public.shops;
CREATE POLICY "anon reads active shops" ON public.shops FOR SELECT TO anon USING (is_active);
CREATE POLICY "auth reads shops" ON public.shops FOR SELECT TO authenticated USING (is_active OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

DROP POLICY "active products public" ON public.products;
CREATE POLICY "anon reads active products" ON public.products FOR SELECT TO anon USING (is_active);
CREATE POLICY "auth reads products" ON public.products FOR SELECT TO authenticated USING (is_active OR public.owns_shop(shop_id) OR public.has_role(auth.uid(),'admin'));

-- lock down helper/trigger function execution
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_shop(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_shop(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_order(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;