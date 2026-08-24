import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Package, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/queries";
import {
  createProduct,
  myShopQuery,
  setProductStock,
  shopProductsQuery,
  updateProduct,
  type ProductFormValues,
  type ShopProduct,
} from "@/lib/shop";

export const Route = createFileRoute("/shop/products")({
  head: () => ({
    meta: [
      { title: "प्रोडक्ट और स्टॉक — RRK Bazaar" },
      { name: "description", content: "दुकान के प्रोडक्ट जोड़ें, दाम बदलें और स्टॉक अपडेट करें." },
      { property: "og:title", content: "प्रोडक्ट और स्टॉक — RRK Bazaar" },
      { property: "og:description", content: "दुकान के प्रोडक्ट जोड़ें, दाम बदलें और स्टॉक अपडेट करें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopProductsPage,
});

const emptyProduct: ProductFormValues = {
  name: "",
  name_hi: "",
  description: "",
  price: 0,
  mrp: null,
  unit: "1 pc",
  stock: 0,
  is_active: true,
  image_url: null,
  category_id: null,
};

function ShopProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: shop } = useQuery(myShopQuery(user?.id));
  const { data: products } = useQuery(shopProductsQuery(shop?.id));
  const [editing, setEditing] = useState<ShopProduct | "new" | null>(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["shop-products"] });
  }

  if (!shop) {
    return (
      <AppShell>
        <PageHeader title="Products" subtitle="कोई दुकान नहीं" />
        <div className="p-6 text-center text-sm text-muted-foreground">पहले दुकान बनाएँ।</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Products & Stock" subtitle={shop.name} />
      <div className="space-y-4 p-4">
        {editing ? (
          <ProductEditor
            product={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={async (values) => {
              if (editing === "new") await createProduct(shop.id, values);
              else await updateProduct(editing.id, values);
              await refresh();
              toast.success("सेव हो गया");
              setEditing(null);
            }}
          />
        ) : (
          <Button className="h-12 w-full font-bold" onClick={() => setEditing("new")}>
            <Plus className="mr-2 size-4" /> नया प्रोडक्ट जोड़ें
          </Button>
        )}

        {(products ?? []).length === 0 && !editing && (
          <p className="py-8 text-center text-sm text-muted-foreground">अभी कोई प्रोडक्ट नहीं है।</p>
        )}

        {(products as ShopProduct[] | undefined)?.map((p) => (
          <section key={p.id} className="rounded-2xl border border-border bg-card p-3 card-shadow">
            <div className="flex items-start gap-3">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="size-14 rounded-xl object-cover" />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="size-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatINR(Number(p.price))} · {p.unit}
                  {!p.is_active && " · बंद"}
                </p>
              </div>
              <Button variant="secondary" className="h-10" onClick={() => setEditing(p)}>
                Edit
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2">
              <span className="text-xs font-bold text-muted-foreground">स्टॉक</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-9"
                  onClick={async () => {
                    await setProductStock(p.id, Math.max(0, p.stock - 1));
                    await refresh();
                  }}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-sm font-bold">{p.stock}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-9"
                  onClick={async () => {
                    await setProductStock(p.id, p.stock + 1);
                    await refresh();
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

function ProductEditor({
  product,
  onSave,
  onCancel,
}: {
  product: ShopProduct | null;
  onSave: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ProductFormValues>(() => {
    if (!product) return emptyProduct;
    const { id: _id, ...rest } = product;
    return rest;
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="space-y-3 rounded-2xl border border-border bg-card p-4 card-shadow"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!values.name.trim() || !values.price) {
          toast.error("नाम और दाम जरूरी है");
          return;
        }
        setSaving(true);
        try {
          await onSave(values);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "सेव नहीं हो पाया");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2 className="text-sm font-bold">{product ? "प्रोडक्ट एडिट करें" : "नया प्रोडक्ट"}</h2>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground">नाम</Label>
        <Input className="h-12" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground">हिन्दी नाम</Label>
        <Input className="h-12" value={values.name_hi ?? ""} onChange={(e) => set("name_hi", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground">दाम (₹)</Label>
          <Input
            inputMode="decimal"
            className="h-12"
            value={String(values.price)}
            onChange={(e) => set("price", Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground">MRP (₹)</Label>
          <Input
            inputMode="decimal"
            className="h-12"
            value={values.mrp == null ? "" : String(values.mrp)}
            onChange={(e) => set("mrp", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground">यूनिट</Label>
          <Input className="h-12" value={values.unit} onChange={(e) => set("unit", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-muted-foreground">स्टॉक</Label>
          <Input
            inputMode="numeric"
            className="h-12"
            value={String(values.stock)}
            onChange={(e) => set("stock", Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground">विवरण</Label>
        <Textarea rows={2} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="h-12 flex-1 font-bold">
          सेव करें
        </Button>
        <Button type="button" variant="outline" className="h-12" onClick={onCancel}>
          रद्द
        </Button>
      </div>
    </form>
  );
}
