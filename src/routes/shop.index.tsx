import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Boxes, ClipboardList, IndianRupee, Pencil, Store } from "lucide-react";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/queries";
import { myShopQuery, resolveShopImage, shopOrdersQuery, shopProductsQuery } from "@/lib/shop";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "My Shop — RRK Bazaar" },
      { name: "description", content: "दुकान की जानकारी, प्रोडक्ट, स्टॉक, ऑर्डर और कमाई एक जगह देखें." },
      { property: "og:title", content: "My Shop — RRK Bazaar" },
      { property: "og:description", content: "दुकान की जानकारी, प्रोडक्ट, स्टॉक, ऑर्डर और कमाई एक जगह देखें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyShopPage,
});

function MyShopPage() {
  const { user } = useAuth();
  const { data: shop, isLoading } = useQuery(myShopQuery(user?.id));
  const { data: products } = useQuery(shopProductsQuery(shop?.id));
  const { data: orders } = useQuery(shopOrdersQuery(shop?.id));
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    void resolveShopImage(shop?.image_url ?? null).then(setLogo);
  }, [shop?.image_url]);

  const delivered = (orders ?? []).filter((o) => o.status === "delivered");
  const earnings = delivered.reduce((sum, o) => sum + Number(o.items_total) - Number(o.commission), 0);
  const lowStock = (products ?? []).filter((p) => p.stock <= 3).length;

  if (!isLoading && !shop) {
    return (
      <AppShell>
        <PageHeader title="My Shop" subtitle="अभी कोई दुकान नहीं" />
        <div className="space-y-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">आपने अभी दुकान नहीं बनाई है।</p>
          <Button asChild className="h-12 w-full font-bold">
            <Link to="/shop/create">दुकान बनाएँ</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title={shop?.name ?? "My Shop"} subtitle={shop?.city ?? undefined} />
      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <div className="flex items-start gap-3">
            {logo ? (
              <img src={logo} alt={shop?.name ?? "shop"} className="size-14 rounded-xl object-cover" />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="size-7" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{shop?.name}</p>
              <p className="text-xs text-muted-foreground">{shop?.owner_name} · {shop?.phone}</p>
              {shop?.description && <p className="mt-1 text-xs text-muted-foreground">{shop.description}</p>}
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
            <Info label="पता" value={[shop?.address, shop?.area].filter(Boolean).join(", ")} />
            <Info label="शहर / जिला" value={[shop?.city, shop?.district].filter(Boolean).join(", ")} />
            <Info label="राज्य / पिन" value={[shop?.state, shop?.pincode].filter(Boolean).join(" - ")} />
            <Info label="समय" value={`${shop?.opens_at?.slice(0, 5) ?? "--"} – ${shop?.closes_at?.slice(0, 5) ?? "--"}`} />
            <Info label="डिलीवरी" value={`${shop?.delivery_radius_km ?? 0} किमी`} />
            <Info label="न्यूनतम ऑर्डर" value={formatINR(Number(shop?.min_order_amount ?? 0))} />
            <Info label="पेमेंट" value={(shop?.payment_options ?? []).join(", ").toUpperCase()} />
            <Info label="GST" value={shop?.has_gst ? (shop.gst_number ?? "—") : "लागू नहीं"} />
          </dl>
          <Button asChild variant="secondary" className="mt-4 h-12 w-full">
            <Link to="/shop/edit">
              <Pencil className="mr-2 size-4" /> Edit Shop
            </Link>
          </Button>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Tile to="/shop/products" icon={Boxes} title="Products" sub={`${products?.length ?? 0} आइटम`} />
          <Tile to="/shop/products" icon={Boxes} title="Stock" sub={`${lowStock} कम स्टॉक`} />
          <Tile to="/shop/orders" icon={ClipboardList} title="Orders" sub={`${orders?.length ?? 0} ऑर्डर`} />
          <Tile to="/shop/earnings" icon={IndianRupee} title="Earnings" sub={formatINR(earnings)} />
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value || "—"}</dd>
    </div>
  );
}

function Tile({
  to,
  icon: Icon,
  title,
  sub,
}: {
  to: "/shop/products" | "/shop/orders" | "/shop/earnings";
  icon: typeof Boxes;
  title: string;
  sub: string;
}) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4 card-shadow">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-2 text-sm font-bold">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
