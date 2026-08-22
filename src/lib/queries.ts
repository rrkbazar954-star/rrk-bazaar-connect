import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_SELECT =
  "id,name,name_hi,description,price,mrp,unit,stock,image_url,keywords,category_id,shop_id,is_active";

export type Product = {
  id: string;
  name: string;
  name_hi: string | null;
  description: string | null;
  price: number;
  mrp: number | null;
  unit: string;
  stock: number;
  image_url: string | null;
  keywords: string[];
  category_id: string | null;
  shop_id: string;
  is_active: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_hi: string;
  name_bn: string;
  name_bho: string;
  icon: string;
  sort_order: number;
};

export const categoriesQuery = {
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data as Category[];
  },
};

export function productsQuery(options: { categoryId?: string | undefined; limit?: number | undefined } = {}) {
  return {
    queryKey: ["products", options.categoryId ?? "all", options.limit ?? 50],
    queryFn: async (): Promise<Product[]> => {
      let q = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).order("name");
      if (options.categoryId) q = q.eq("category_id", options.categoryId);
      const { data, error } = await q.limit(options.limit ?? 50);
      if (error) throw error;
      return data as Product[];
    },
  };
}

export function productQuery(id: string) {
  return {
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Product) ?? null;
    },
  };
}

/** Keyword search across name, hindi name, description and keyword tags. */
export async function searchProducts(keywords: string[]): Promise<Product[]> {
  const terms = keywords.map((k) => k.trim()).filter(Boolean).slice(0, 8);
  if (terms.length === 0) return [];

  const filters = terms
    .flatMap((term) => [`name.ilike.%${term}%`, `name_hi.ilike.%${term}%`, `description.ilike.%${term}%`])
    .join(",");

  const [byText, byTag] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).or(filters).limit(40),
    supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).overlaps("keywords", terms).limit(40),
  ]);

  const merged = new Map<string, Product>();
  for (const row of [...(byText.data ?? []), ...(byTag.data ?? [])] as Product[]) merged.set(row.id, row);
  return [...merged.values()];
}

/** Fallback used when nothing matches exactly: same category as the closest guess, else popular items. */
export async function similarProducts(terms: string[]): Promise<Product[]> {
  if (terms.length) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id,slug,name_en,name_hi")
      .or(terms.map((t) => `name_en.ilike.%${t}%`).join(","))
      .limit(1);
    const categoryId = cats?.[0]?.id;
    if (categoryId) {
      const { data } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .eq("category_id", categoryId)
        .limit(12);
      if (data?.length) return data as Product[];
    }
  }
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).limit(12);
  return (data ?? []) as Product[];
}

export function cartQuery(userId: string | undefined) {
  return {
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`id,qty,product_id,products(${PRODUCT_SELECT})`)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; qty: number; product_id: string; products: Product | null }>;
    },
  };
}

export async function addToCart(userId: string, productId: string, qty = 1) {
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id,qty")
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from("cart_items").update({ qty: existing.qty + qty }).eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("cart_items").insert({ user_id: userId, product_id: productId, qty });
  if (error) throw error;
}

export async function setCartQty(itemId: string, qty: number) {
  if (qty <= 0) {
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("cart_items").update({ qty }).eq("id", itemId);
  if (error) throw error;
}

export const ORDER_STATUS_FLOW = [
  "placed",
  "accepted",
  "ready",
  "picked_up",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStatus =
  | (typeof ORDER_STATUS_FLOW)[number]
  | "rejected"
  | "cancelled";

export const statusLabels: Record<OrderStatus, { hi: string; en: string }> = {
  placed: { hi: "ऑर्डर मिला", en: "Order placed" },
  accepted: { hi: "दुकान ने स्वीकार किया", en: "Accepted by shop" },
  ready: { hi: "पिकअप के लिए तैयार", en: "Ready for pickup" },
  picked_up: { hi: "उठा लिया गया", en: "Picked up" },
  out_for_delivery: { hi: "डिलीवरी के रास्ते में", en: "Out for delivery" },
  delivered: { hi: "डिलीवर हो गया", en: "Delivered" },
  rejected: { hi: "दुकान ने मना किया", en: "Rejected by shop" },
  cancelled: { hi: "रद्द", en: "Cancelled" },
};

export function formatINR(value: number) {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
