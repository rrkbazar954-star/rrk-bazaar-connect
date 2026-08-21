import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cartQuery, formatINR, setCartQty } from "@/lib/queries";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "कार्ट — RRK Bazaar" },
      { name: "description", content: "अपना कार्ट देखें और ऑर्डर पक्का करें — RRK Bazaar." },
      { property: "og:title", content: "कार्ट — RRK Bazaar" },
      { property: "og:description", content: "अपना कार्ट देखें और ऑर्डर पक्का करें — RRK Bazaar." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: items } = useQuery(cartQuery(user?.id));

  const update = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => setCartQty(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const total = (items ?? []).reduce((sum, item) => sum + (item.products?.price ?? 0) * item.qty, 0);

  if (!user) {
    return (
      <AppShell>
        <PageHeader title={t("cart")} />
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
      <PageHeader title={t("cart")} subtitle={`${items?.length ?? 0} items`} />
      {!items?.length ? (
        <div className="space-y-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("cart_empty")}</p>
          <Button asChild variant="secondary" className="h-12 w-full">
            <Link to="/">{t("home")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-3 p-4">
            {items.map((item) => {
              const product = item.products;
              const title = product ? (lang === "en" ? product.name : product.name_hi || product.name) : "";
              return (
                <li key={item.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 card-shadow">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface">
                    {product?.image_url ? (
                      <img src={product.image_url} alt={title} className="size-full object-cover" />
                    ) : (
                      <ImageOff className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{product?.unit}</p>
                    <p className="mt-1 text-sm font-bold">{formatINR((product?.price ?? 0) * item.qty)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      aria-label="remove"
                      className="text-muted-foreground"
                      onClick={() => update.mutate({ id: item.id, qty: 0 })}
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <div className="flex items-center gap-1 rounded-xl bg-primary p-0.5 text-primary-foreground">
                      <button
                        type="button"
                        aria-label="minus"
                        className="flex size-8 items-center justify-center"
                        onClick={() => update.mutate({ id: item.id, qty: item.qty - 1 })}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-5 text-center text-sm font-bold">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="plus"
                        className="flex size-8 items-center justify-center"
                        onClick={() => update.mutate({ id: item.id, qty: item.qty + 1 })}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md border-t border-border bg-card p-3 safe-bottom">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("items_total")}</span>
              <span className="font-bold">{formatINR(total)}</span>
            </div>
            <Button asChild className="h-14 w-full text-base font-bold">
              <Link to="/checkout">{t("checkout")}</Link>
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
