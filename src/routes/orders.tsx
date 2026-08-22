import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { formatINR, statusLabels, type OrderStatus } from "@/lib/queries";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "मेरे ऑर्डर — RRK Bazaar" },
      { name: "description", content: "अपने ऑर्डर और डिलीवरी की स्थिति देखें — RRK Bazaar." },
      { property: "og:title", content: "मेरे ऑर्डर — RRK Bazaar" },
      { property: "og:description", content: "अपने ऑर्डर और डिलीवरी की स्थिति देखें — RRK Bazaar." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_code,status,total,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!user) {
    return (
      <AppShell>
        <PageHeader title={t("orders")} />
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
      <PageHeader title={t("orders")} subtitle={`${orders?.length ?? 0}`} />
      {!orders?.length ? (
        <div className="space-y-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("no_orders")}</p>
          <Button asChild variant="secondary" className="h-12 w-full">
            <Link to="/">{t("home")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3 p-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border bg-card p-4 card-shadow">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">#{order.order_code}</p>
                <span className="rounded-lg bg-surface px-2 py-1 text-[11px] font-semibold">
                  {lang === "en"
                    ? statusLabels[order.status as OrderStatus].en
                    : statusLabels[order.status as OrderStatus].hi}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-sm font-bold">{formatINR(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
