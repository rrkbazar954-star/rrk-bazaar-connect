import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useLocationCtx } from "@/lib/location";
import { cartQuery, formatINR } from "@/lib/queries";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "ऑर्डर करें — RRK Bazaar" },
      { name: "description", content: "पता पक्का करें और कैश ऑन डिलीवरी से ऑर्डर करें — RRK Bazaar." },
      { property: "og:title", content: "ऑर्डर करें — RRK Bazaar" },
      { property: "og:description", content: "पता पक्का करें और कैश ऑन डिलीवरी से ऑर्डर करें — RRK Bazaar." },
    ],
  }),
  component: CheckoutPage,
});

const DELIVERY_FEE = 20;

function CheckoutPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { location } = useLocationCtx();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: items } = useQuery(cartQuery(user?.id));

  const itemsTotal = (items ?? []).reduce((sum, item) => sum + (item.products?.price ?? 0) * item.qty, 0);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t("login_required"));
      if (!location) throw new Error(t("select_location"));
      const cart = (items ?? []).filter((item) => item.products);
      if (!cart.length) throw new Error(t("cart_empty"));

      const shopId = cart[0]!.products!.shop_id;
      const shopItems = cart.filter((item) => item.products!.shop_id === shopId);
      const total = shopItems.reduce((sum, item) => sum + item.products!.price * item.qty, 0);

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          shop_id: shopId,
          address: JSON.parse(JSON.stringify(location)),
          items_total: total,
          delivery_fee: DELIVERY_FEE,
          total: total + DELIVERY_FEE,
          payment_method: "cod",
        })
        .select("id,order_code")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        shopItems.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          name: item.products!.name,
          price: item.products!.price,
          qty: item.qty,
          image_url: item.products!.image_url,
        })),
      );
      if (itemsError) throw itemsError;

      await supabase
        .from("cart_items")
        .delete()
        .in("id", shopItems.map((item) => item.id));

      return order;
    },
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`#${order.order_code}`);
      void navigate({ to: "/orders" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!user) {
    return (
      <AppShell>
        <PageHeader title={t("checkout")} />
        <div className="space-y-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("login_required")}</p>
          <Button asChild className="h-12 w-full">
            <Link to="/auth">{t("login")}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title={t("checkout")} />
      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <h2 className="text-sm font-bold text-muted-foreground">{t("deliver_to")}</h2>
          {location ? (
            <p className="mt-1 text-sm font-semibold">
              {location.line1}
              {location.city ? `, ${location.city}` : ""} {location.pincode}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">{t("select_location")}</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <ul className="space-y-2">
            {(items ?? []).map((item) => (
              <li key={item.id} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {item.products?.name} × {item.qty}
                </span>
                <span className="font-semibold">{formatINR((item.products?.price ?? 0) * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span>{formatINR(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{formatINR(DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>{t("total")}</span>
              <span>{formatINR(itemsTotal + DELIVERY_FEE)}</span>
            </div>
          </div>
        </section>

        <Button
          className="h-14 w-full text-base font-bold"
          onClick={() => placeOrder.mutate()}
          disabled={placeOrder.isPending || !items?.length}
        >
          {t("checkout")} (COD)
        </Button>
      </div>
    </AppShell>
  );
}
