import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Home, Pencil, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { SellerShell } from "@/components/SellerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { myShopQuery, PAYMENT_OPTIONS } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/profile")({
  head: () => ({
    meta: [
      { title: "Seller Profile — RRK Bazaar" },
      { name: "description", content: "दुकानदार की जानकारी और पेमेंट मेथड (UPI, कैश) यहाँ बदलें." },
      { property: "og:title", content: "Seller Profile — RRK Bazaar" },
      { property: "og:description", content: "दुकानदार की जानकारी और पेमेंट मेथड (UPI, कैश) यहाँ बदलें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellerProfilePage,
});

function SellerProfilePage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { data: shop } = useQuery(myShopQuery(user?.id));
  const [options, setOptions] = useState<string[]>([]);
  const [upi, setUpi] = useState("");

  useEffect(() => {
    if (!shop) return;
    setOptions(shop.payment_options ?? []);
    setUpi(shop.upi_id ?? "");
  }, [shop]);

  const save = useMutation({
    mutationFn: async () => {
      if (!shop) throw new Error("दुकान नहीं मिली");
      const { error } = await supabase
        .from("shops")
        .update({ payment_options: options, upi_id: options.includes("upi") ? upi.trim() || null : null })
        .eq("id", shop.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("पेमेंट मेथड सेव हो गया");
      void queryClient.invalidateQueries({ queryKey: ["my-shop"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SellerShell>
      <PageHeader title="Seller Profile" subtitle={shop?.name ?? user?.email ?? undefined} />
      <div className="space-y-5 p-4">
        <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <p className="text-sm font-bold">{shop?.owner_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{shop?.phone ?? user?.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[shop?.address, shop?.area, shop?.city, shop?.pincode].filter(Boolean).join(", ")}
          </p>
          <Button asChild variant="secondary" className="mt-3 h-11 w-full">
            <Link to="/shop/edit">
              <Pencil className="mr-2 size-4" /> दुकान / पता बदलें
            </Link>
          </Button>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4 card-shadow">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Wallet className="size-4 text-primary" /> पेमेंट मेथड
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = options.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setOptions(active ? options.filter((v) => v !== opt.value) : [...options, opt.value])
                  }
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-xs font-semibold",
                    active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {opt.hi}
                </button>
              );
            })}
          </div>
          {options.includes("upi") && (
            <Input placeholder="name@upi" value={upi} onChange={(e) => setUpi(e.target.value)} className="h-11" />
          )}
          <Button className="h-11 w-full font-bold" disabled={save.isPending} onClick={() => save.mutate()}>
            सेव करें
          </Button>
        </section>

        <Button asChild variant="outline" className="h-11 w-full justify-start">
          <Link to="/">
            <Home className="mr-2 size-4" /> ग्राहक ऐप पर जाएँ
          </Link>
        </Button>
        {user && (
          <Button variant="outline" className="h-11 w-full" onClick={() => void signOut()}>
            लॉग आउट
          </Button>
        )}
      </div>
    </SellerShell>
  );
}
