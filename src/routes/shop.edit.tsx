import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { ShopForm } from "@/components/ShopForm";
import { useAuth } from "@/lib/auth";
import { myShopQuery, updateShop } from "@/lib/shop";

export const Route = createFileRoute("/shop/edit")({
  head: () => ({
    meta: [
      { title: "दुकान एडिट करें — RRK Bazaar" },
      { name: "description", content: "दुकान की जानकारी, समय, डिलीवरी एरिया और पेमेंट विकल्प अपडेट करें." },
      { property: "og:title", content: "दुकान एडिट करें — RRK Bazaar" },
      { property: "og:description", content: "दुकान की जानकारी, समय, डिलीवरी एरिया और पेमेंट विकल्प अपडेट करें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditShopPage,
});

function EditShopPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: shop, isLoading } = useQuery(myShopQuery(user?.id));

  return (
    <AppShell>
      <PageHeader title="Edit Shop" subtitle={shop?.name ?? undefined} />
      {isLoading ? (
        <div className="p-6 text-center text-sm text-muted-foreground">लोड हो रहा है…</div>
      ) : !shop ? (
        <div className="p-6 text-center text-sm text-muted-foreground">पहले दुकान बनाएँ।</div>
      ) : (
        <ShopForm
          shop={shop}
          submitLabel="सेव करें"
          onSubmit={async (values) => {
            await updateShop(shop.id, values);
            await queryClient.invalidateQueries({ queryKey: ["my-shop"] });
            toast.success("दुकान अपडेट हो गई!");
            void navigate({ to: "/shop" });
          }}
        />
      )}
    </AppShell>
  );
}
