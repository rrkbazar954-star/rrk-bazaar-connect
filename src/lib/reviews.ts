import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export function reviewsQuery(productId: string | undefined) {
  return {
    queryKey: ["product-reviews", productId],
    enabled: !!productId,
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id,product_id,user_id,rating,comment,created_at")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  };
}

/** Saves (or replaces) the current user's rating for a product. */
export async function rateProduct(userId: string, productId: string, rating: number, comment?: string) {
  const { error } = await supabase
    .from("product_reviews")
    .upsert(
      { user_id: userId, product_id: productId, rating, comment: comment?.trim() || null },
      { onConflict: "product_id,user_id" },
    );
  if (error) throw error;
}

/** Counts a product click so sellers can see views in their dashboard. */
export async function trackProductView(productId: string) {
  await supabase.rpc("increment_product_view", { _product_id: productId });
}
