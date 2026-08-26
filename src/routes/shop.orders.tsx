import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { SellerShell } from "@/components/SellerShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { formatINR, statusLabels, type OrderStatus } from "@/lib/queries";
import { myShopQuery, setOrderStatus, shopOrdersQuery } from "@/lib/shop";

export const Route = createFileRoute("/shop/orders")({
  head: () => ({
    meta: [
      { title: "दुकान के ऑर्डर — RRK Bazaar" },
      { name: "description", content: "नए ऑर्डर स्वीकार करें और पिकअप के लिए तैयार मार्क करें." },
      { property: "og:title", content: "दुकान के ऑर्डर — RRK Bazaar" },
      { property: "og:description", content: "नए ऑर्डर स्वीकार करें और पिकअप के लिए तैयार मार्क करें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopOrdersPage,
});

function ShopOrdersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: shop } = useQuery(myShopQuery(user?.id));
  const { data: orders } = useQuery(shopOrdersQuery(shop?.id));

  async function act(orderId: string, status: "accepted" | "rejected" | "ready") {
    try {
      await setOrderStatus(orderId, status);
      await queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
      toast.success("अपडेट हो गया");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "अपडेट नहीं हो पाया");
    }
  }

  if (!shop) {
    return (
      <SellerShell>
        <PageHeader title="Orders" subtitle="कोई दुकान नहीं" />
        <div className="p-6 text-center text-sm text-muted-foreground">पहले दुकान बनाएँ।</div>
      </SellerShell>
    );
  }

  return (
    <SellerShell>
      <PageHeader title="Orders" subtitle={shop.name} />
      <div className="space-y-3 p-4">
        {(orders ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">अभी कोई ऑर्डर नहीं आया।</p>
        )}
        {(orders ?? []).map((o) => {
          const status = o.status as OrderStatus;
          return (
            <section key={o.id} className="rounded-2xl border border-border bg-card p-4 card-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{o.order_code}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  {statusLabels[status]?.hi ?? status}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold">{formatINR(Number(o.total))}</p>
              {status === "placed" && (
                <div className="mt-3 flex gap-2">
                  <Button className="h-11 flex-1 font-bold" onClick={() => void act(o.id, "accepted")}>
                    स्वीकार करें
                  </Button>
                  <Button variant="outline" className="h-11" onClick={() => void act(o.id, "rejected")}>
                    मना करें
                  </Button>
                </div>
              )}
              {status === "accepted" && (
                <Button className="mt-3 h-11 w-full font-bold" onClick={() => void act(o.id, "ready")}>
                  तैयार है (Ready)
                </Button>
              )}
            </section>
          );
        })}
      </div>
    </SellerShell>
  );
}
