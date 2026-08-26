import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { SellerShell } from "@/components/SellerShell";
import { ShopForm } from "@/components/ShopForm";
import { useAuth } from "@/lib/auth";
import { createShop, myShopQuery } from "@/lib/shop";

export const Route = createFileRoute("/shop/create")({
  head: () => ({
    meta: [
      { title: "दुकान बनाएँ — RRK Bazaar" },
      { name: "description", content: "अपनी दुकान RRK Bazaar पर रजिस्टर करें और ऑनलाइन ऑर्डर लेना शुरू करें." },
      { property: "og:title", content: "दुकान बनाएँ — RRK Bazaar" },
      { property: "og:description", content: "अपनी दुकान RRK Bazaar पर रजिस्टर करें और ऑनलाइन ऑर्डर लेना शुरू करें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateShopPage,
});

function CreateShopPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: existing } = useQuery(myShopQuery(user?.id));

  return (
    <SellerShell>
      <PageHeader title="दुकान बनाएँ" subtitle="Create your shop" />
      {existing ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          आपकी दुकान पहले से बनी है — My Shop खोलें।
        </div>
      ) : (
        <ShopForm
          submitLabel="दुकान बनाएँ"
          onSubmit={async (values) => {
            if (!user) return;
            await createShop(user.id, values);
            await queryClient.invalidateQueries({ queryKey: ["my-shop"] });
            toast.success("दुकान बन गई!");
            void navigate({ to: "/shop" });
          }}
        />
      )}
    </SellerShell>
  );
}
