-- enums
CREATE TYPE public.app_role AS ENUM ('customer','seller','delivery','admin');
CREATE TYPE public.order_status AS ENUM ('placed','accepted','rejected','ready','picked_up','out_for_delivery','delivered','cancelled');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  language TEXT NOT NULL DEFAULT 'hi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "self assign basic roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role <> 'admin');

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- auto-create profile + customer role
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  name_bho TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'shopping-basket',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- shops
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  phone TEXT,
  image_url TEXT,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 8,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT SELECT ON public.shops TO anon;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER shops_updated BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "active shops public" ON public.shops FOR SELECT TO anon, authenticated USING (is_active OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "seller creates own shop" ON public.shops FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(),'seller'));
CREATE POLICY "seller updates own shop" ON public.shops FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin deletes shops" ON public.shops FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.owns_shop(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops WHERE id = _shop_id AND owner_id = auth.uid());
$$;

-- products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_hi TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  mrp NUMERIC(10,2),
  unit TEXT NOT NULL DEFAULT '1 pc',
  stock INT NOT NULL DEFAULT 0,
  image_url TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "active products public" ON public.products FOR SELECT TO anon, authenticated USING (is_active OR public.owns_shop(shop_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "seller manages own products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.owns_shop(shop_id));
CREATE POLICY "seller updates own products" ON public.products FOR UPDATE TO authenticated USING (public.owns_shop(shop_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.owns_shop(shop_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "seller deletes own products" ON public.products FOR DELETE TO authenticated USING (public.owns_shop(shop_id) OR public.has_role(auth.uid(),'admin'));

-- cart
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  qty INT NOT NULL DEFAULT 1 CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- delivery partners
CREATE TABLE public.delivery_partners (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT NOT NULL DEFAULT 'bike',
  is_available BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.delivery_partners TO authenticated;
GRANT ALL ON public.delivery_partners TO service_role;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER dp_updated BEFORE UPDATE ON public.delivery_partners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "dp read own" ON public.delivery_partners FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "dp insert own" ON public.delivery_partners FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "dp update own" ON public.delivery_partners FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE DEFAULT ('RRK' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  customer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops ON DELETE RESTRICT,
  delivery_partner_id UUID REFERENCES auth.users ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'placed',
  address JSONB NOT NULL,
  items_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 25,
  commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "orders visible to parties" ON public.orders FOR SELECT TO authenticated USING (
  customer_id = auth.uid()
  OR public.owns_shop(shop_id)
  OR delivery_partner_id = auth.uid()
  OR (public.has_role(auth.uid(),'delivery') AND delivery_partner_id IS NULL AND status = 'ready')
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "customer creates order" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "parties update order" ON public.orders FOR UPDATE TO authenticated USING (
  customer_id = auth.uid()
  OR public.owns_shop(shop_id)
  OR delivery_partner_id = auth.uid()
  OR (public.has_role(auth.uid(),'delivery') AND delivery_partner_id IS NULL AND status = 'ready')
  OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  customer_id = auth.uid()
  OR public.owns_shop(shop_id)
  OR delivery_partner_id = auth.uid()
  OR public.has_role(auth.uid(),'delivery')
  OR public.has_role(auth.uid(),'admin')
);

CREATE OR REPLACE FUNCTION public.can_view_order(_order_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = _order_id AND (
      o.customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = o.shop_id AND s.owner_id = auth.uid())
      OR o.delivery_partner_id = auth.uid()
      OR (public.has_role(auth.uid(),'delivery') AND o.delivery_partner_id IS NULL AND o.status = 'ready')
      OR public.has_role(auth.uid(),'admin')
    )
  );
$$;

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  qty INT NOT NULL,
  image_url TEXT
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items visible to parties" ON public.order_items FOR SELECT TO authenticated USING (public.can_view_order(order_id));
CREATE POLICY "customer adds order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- settings
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin writes settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- seed
INSERT INTO public.categories (slug,name_en,name_hi,name_bn,name_bho,icon,sort_order) VALUES
 ('grocery','Grocery','किराना','মুদি','किराना','wheat',1),
 ('vegetables','Vegetables & Fruits','सब्ज़ी और फल','সবজি ও ফল','सब्जी अउर फल','carrot',2),
 ('dairy','Dairy & Bakery','डेयरी और बेकरी','দুগ্ধ ও বেকারি','दूध अउर बेकरी','milk',3),
 ('snacks','Snacks & Drinks','स्नैक्स और पेय','স্ন্যাকস ও পানীয়','नाश्ता अउर पेय','cookie',4),
 ('household','Household','घरेलू सामान','গৃহস্থালি','घर के सामान','spray-can',5),
 ('personal-care','Personal Care','पर्सनल केयर','ব্যক্তিগত পরিচর্যা','निजी देखभाल','sparkles',6),
 ('medicine','Medicine','दवाइयाँ','ঔষধ','दवाई','pill',7),
 ('electronics','Electronics','इलेक्ट्रॉनिक्स','ইলেকট্রনিকস','बिजली सामान','plug-zap',8);

INSERT INTO public.shops (id,name,description,address,city,pincode,phone,commission_pct)
VALUES ('11111111-1111-1111-1111-111111111111','RRK Kirana Store','आपके मोहल्ले की भरोसेमंद दुकान','Main Bazaar Road','Patna','800001','9999900000',8);

INSERT INTO public.products (shop_id,category_id,name,name_hi,description,price,mrp,unit,stock,keywords) VALUES
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='grocery'),'Aashirvaad Atta','आशीर्वाद आटा','Whole wheat flour',255,299,'5 kg',40,ARRAY['atta','flour','आटा','gehu']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='grocery'),'Basmati Rice','बासमती चावल','Long grain basmati rice',180,220,'1 kg',60,ARRAY['rice','chawal','चावल','basmati']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='grocery'),'Toor Dal','तूर दाल','Premium arhar dal',145,170,'1 kg',50,ARRAY['dal','arhar','दाल','pulses']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='grocery'),'Mustard Oil','सरसों तेल','Kachi ghani mustard oil',165,199,'1 L',35,ARRAY['oil','tel','सरसों','mustard']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='vegetables'),'Tomato','टमाटर','Fresh tomatoes',30,40,'1 kg',80,ARRAY['tomato','tamatar','टमाटर']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='vegetables'),'Onion','प्याज','Fresh onions',35,45,'1 kg',90,ARRAY['onion','pyaz','प्याज']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='vegetables'),'Potato','आलू','Fresh potatoes',28,35,'1 kg',100,ARRAY['potato','aloo','आलू']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='vegetables'),'Banana','केला','Ripe bananas',50,60,'1 dozen',45,ARRAY['banana','kela','केला']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='dairy'),'Amul Milk','अमूल दूध','Toned milk pouch',28,30,'500 ml',70,ARRAY['milk','doodh','दूध','amul']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='dairy'),'Paneer','पनीर','Fresh malai paneer',95,110,'200 g',25,ARRAY['paneer','पनीर','cheese']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='dairy'),'Brown Bread','ब्राउन ब्रेड','Whole wheat bread',45,50,'400 g',30,ARRAY['bread','ब्रेड','pav']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='snacks'),'Parle-G Biscuit','पारले-जी बिस्कुट','Glucose biscuits',10,10,'80 g',150,ARRAY['biscuit','biskut','बिस्कुट','parle']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='snacks'),'Tata Tea Gold','टाटा टी गोल्ड','Premium tea leaves',260,290,'500 g',40,ARRAY['tea','chai','चाय','tata']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='snacks'),'Coca Cola','कोका कोला','Chilled soft drink',40,45,'750 ml',60,ARRAY['cola','cold drink','कोल्ड ड्रिंक']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='household'),'Surf Excel Powder','सर्फ एक्सेल पाउडर','Detergent powder',210,240,'1 kg',30,ARRAY['detergent','surf','साबुन','washing']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='household'),'Harpic Toilet Cleaner','हार्पिक टॉयलेट क्लीनर','Toilet cleaner',95,115,'500 ml',25,ARRAY['harpic','cleaner','क्लीनर']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='personal-care')  ,'Colgate Toothpaste','कोलगेट टूथपेस्ट','Strong teeth toothpaste',55,65,'100 g',55,ARRAY['toothpaste','colgate','मंजन','brush']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='personal-care'),'Dove Soap','डव साबुन','Moisturising bar',60,70,'100 g',60,ARRAY['soap','sabun','साबुन','dove']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='medicine'),'Paracetamol 500','पैरासिटामोल 500','Fever and pain relief',30,35,'10 tablets',80,ARRAY['paracetamol','bukhar','दवा','fever']),
 ('11111111-1111-1111-1111-111111111111',(SELECT id FROM public.categories WHERE slug='electronics'),'LED Bulb 9W','एलईडी बल्ब 9W','Cool daylight bulb',85,110,'1 pc',40,ARRAY['bulb','led','बल्ब','light']);

INSERT INTO public.app_settings (key,value) VALUES
 ('commission', '{"default_pct": 8}'),
 ('delivery', '{"fee": 25, "free_above": 499}');