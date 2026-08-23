import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export type Shop = {
  id: string;
  owner_id: string | null;
  owner_name: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  image_url: string | null;
  phone: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  opens_at: string | null;
  closes_at: string | null;
  delivery_radius_km: number;
  min_order_amount: number;
  payment_options: string[];
  has_gst: boolean;
  gst_number: string | null;
  commission_pct: number;
  is_active: boolean;
};

export const SHOP_SELECT =
  "id,owner_id,owner_name,name,description,category_id,image_url,phone,address,area,city,district,state,pincode,lat,lng,opens_at,closes_at,delivery_radius_km,min_order_amount,payment_options,has_gst,gst_number,commission_pct,is_active";

export const PAYMENT_OPTIONS = [
  { value: "cod", hi: "कैश ऑन डिलीवरी", en: "Cash on delivery" },
  { value: "upi", hi: "UPI", en: "UPI" },
  { value: "card", hi: "कार्ड", en: "Card" },
  { value: "wallet", hi: "वॉलेट", en: "Wallet" },
] as const;

export function myShopQuery(userId: string | undefined) {
  return {
    queryKey: ["my-shop", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Shop | null> => {
      const { data, error } = await supabase
        .from("shops")
        .select(SHOP_SELECT)
        .eq("owner_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Shop | null) ?? null;
    },
  };
}

export type ShopFormValues = Omit<Shop, "id" | "owner_id" | "commission_pct" | "is_active">;

/** Makes sure the current user holds the seller role before shop writes. */
export async function ensureSellerRole(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "seller")
    .maybeSingle();
  if (data) return;
  await supabase.from("user_roles").insert({ user_id: userId, role: "seller" });
}

export async function createShop(userId: string, values: ShopFormValues) {
  await ensureSellerRole(userId);
  const payload: TablesInsert<"shops"> = { ...values, owner_id: userId };
  const { data, error } = await supabase.from("shops").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateShop(shopId: string, values: ShopFormValues) {
  const { error } = await supabase.from("shops").update(values).eq("id", shopId);
  if (error) throw error;
}

/** Uploads a shop photo to the private shop-media bucket and returns its storage path. */
export async function uploadShopImage(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("shop-media").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/** Storage paths need a signed URL; full URLs are returned as-is. */
export async function resolveShopImage(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("http")) return value;
  const { data } = await supabase.storage.from("shop-media").createSignedUrl(value, 3600);
  return data?.signedUrl ?? null;
}

export function shopOrdersQuery(shopId: string | undefined) {
  return {
    queryKey: ["shop-orders", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_code,status,total,items_total,commission,created_at")
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  };
}

export function shopProductsQuery(shopId: string | undefined) {
  return {
    queryKey: ["shop-products", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,price,mrp,unit,stock,is_active,image_url,category_id")
        .eq("shop_id", shopId!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  };
}
