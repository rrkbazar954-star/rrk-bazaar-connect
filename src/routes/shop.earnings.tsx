import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/AppShell";
import { SellerShell } from "@/components/SellerShell";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/queries";
import { myShopQuery, shopOrdersQuery } from "@/lib/shop";

export const Route = createFileRoute("/shop/earnings")({
  head: () => ({
    meta: [
      { title: "कमाई — RRK Bazaar" },
      { name: "description", content: "डिलीवर हुए ऑर्डर, कमीशन और सेटलमेंट की कमाई देखें." },
      { property: "og:title", content: "कमाई — RRK Bazaar" },
      { property: "og:description", content: "डिलीवर हुए ऑर्डर, कमीशन और सेटलमेंट की कमाई देखें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopEarningsPage,
});

function ShopEarningsPage() {
  const { user } = useAuth();
  const { data: shop } = useQuery(myShopQuery(user?.id));
  const { data: orders } = useQuery(shopOrdersQuery(shop?.id));

  const delivered = (orders ?? []).filter((o) => o.status === "delivered");
  const sales = delivered.reduce((s, o) => s + Number(o.items_total), 0);
  const commission = delivered.reduce((s, o) => s + Number(o.commission), 0);
  const earnings = sales - commission;
  const pending = (orders ?? []).filter((o) => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "rejected");
  const pendingValue = pending.reduce((s, o) => s + Number(o.items_total), 0);

  if (!shop) {
    return (
      <SellerShell>
        <PageHeader title="Earnings" subtitle="कोई दुकान नहीं" />
        <div className="p-6 text-center text-sm text-muted-foreground">पहले दुकान बनाएँ।</div>
      </SellerShell>
    );
  }

  return (
    <SellerShell>
      <PageHeader title="Earnings" subtitle={shop.name} />
      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <p className="text-xs font-bold text-muted-foreground">कुल कमाई (सेटलमेंट योग्य)</p>
          <p className="mt-1 text-3xl font-extrabold text-primary">{formatINR(earnings)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{delivered.length} डिलीवर हुए ऑर्डर</p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="डिलीवर सेल्स" value={formatINR(sales)} />
          <Stat label={`कमीशन (${shop.commission_pct}%)`} value={`- ${formatINR(commission)}`} />
          <Stat label="चल रहे ऑर्डर" value={String(pending.length)} />
          <Stat label="चल रहा मूल्य" value={formatINR(pendingValue)} />
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <h2 className="text-sm font-bold">सेटलमेंट सारांश</h2>
          <div className="mt-3 space-y-2 text-sm">
            {delivered.length === 0 ? (
              <p className="text-xs text-muted-foreground">अभी कोई डिलीवर ऑर्डर नहीं।</p>
            ) : (
              delivered.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-semibold">{o.order_code}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <p className="font-bold">{formatINR(Number(o.items_total) - Number(o.commission))}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </SellerShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
