import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Film, ImagePlus, Loader2, Minus, Package, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/AppShell";
import { SellerShell } from "@/components/SellerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { formatINR, categoriesQuery } from "@/lib/queries";
import { describeProduct } from "@/lib/product-ai.functions";
import {
  createProduct,
  discountPct,
  myShopQuery,
  setProductStock,
  shopProductsQuery,
  updateProduct,
  uploadProductMedia,
  type ProductFormValues,
  type ShopProduct,
} from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/products")({
  head: () => ({
    meta: [
      { title: "प्रोडक्ट और स्टॉक — RRK Bazaar" },
      { name: "description", content: "5 फोटो और वीडियो के साथ प्रोडक्ट जोड़ें, AI से नाम-विवरण लिखवाएँ, दाम और स्टॉक अपडेट करें." },
      { property: "og:title", content: "प्रोडक्ट और स्टॉक — RRK Bazaar" },
      { property: "og:description", content: "5 फोटो और वीडियो के साथ प्रोडक्ट जोड़ें, AI से नाम-विवरण लिखवाएँ, दाम और स्टॉक अपडेट करें." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopProductsPage,
});

const MAX_PHOTOS = 5;

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
  images: [],
  video_url: null,
  colors: [],
  sizes: [],
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
      <SellerShell>
        <PageHeader title="Products" subtitle="कोई दुकान नहीं" />
        <div className="p-6 text-center text-sm text-muted-foreground">पहले दुकान बनाएँ।</div>
      </SellerShell>
    );
  }

  return (
    <SellerShell>
      <PageHeader title="Products & Stock" subtitle={shop.name} />
      <div className="space-y-4 p-4">
        {editing ? (
          <ProductEditor
            product={editing === "new" ? null : editing}
            userId={user?.id}
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

        {(products as ShopProduct[] | undefined)?.map((p) => {
          const off = discountPct(p.mrp, Number(p.price));
          return (
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
                  {off > 0 && (
                    <span className="mt-1 inline-block rounded-md bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
                      {off}% OFF
                    </span>
                  )}
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
          );
        })}
      </div>
    </SellerShell>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Chip list editor for colour / size variants. */
function ChipInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || values.includes(value)) return setDraft("");
    onChange([...values, value]);
    setDraft("");
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="flex min-h-9 items-center gap-1 rounded-xl border border-primary bg-primary/10 px-2.5 text-xs font-bold text-primary"
            >
              {v}
              <X className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          className="h-12"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" className="h-12" onClick={add}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProductEditor({
  product,
  userId,
  onSave,
  onCancel,
}: {
  product: ShopProduct | null;
  userId: string | undefined;
  onSave: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const { data: categories } = useQuery(categoriesQuery);
  const [values, setValues] = useState<ProductFormValues>(() => {
    if (!product) return emptyProduct;
    const { id: _id, ...rest } = product;
    return { ...emptyProduct, ...rest };
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const aiDone = useRef(product != null);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const off = discountPct(values.mrp, values.price);

  /** Runs AI once on the first photo so name/description/variants fill themselves. */
  async function autofill(file: File) {
    if (aiDone.current) return;
    aiDone.current = true;
    setAiBusy(true);
    try {
      const image = await fileToDataUrl(file);
      const draft = await describeProduct({ data: { image } });
      if (!draft.name && !draft.description) {
        toast.info("AI से जानकारी नहीं मिली — खुद भर दें");
        return;
      }
      setValues((prev) => ({
        ...prev,
        name: prev.name || draft.name,
        name_hi: prev.name_hi || draft.name_hi,
        description: prev.description || draft.description,
        unit: draft.unit || prev.unit,
        colors: prev.colors.length ? prev.colors : draft.colors,
        sizes: prev.sizes.length ? prev.sizes : draft.sizes,
        category_id:
          prev.category_id ??
          (categories ?? []).find((c) =>
            draft.category
              ? c.name_en.toLowerCase().includes(draft.category.toLowerCase()) ||
                draft.category.toLowerCase().includes(c.name_en.toLowerCase())
              : false,
          )?.id ??
          null,
      }));
      toast.success("AI ने नाम और विवरण लिख दिया");
    } catch {
      toast.error("AI विवरण नहीं लिख पाया");
    } finally {
      setAiBusy(false);
    }
  }

  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!userId) return;
    const room = MAX_PHOTOS - values.images.length;
    if (room <= 0) {
      toast.info(`सिर्फ ${MAX_PHOTOS} फोटो तक`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of picked) urls.push(await uploadProductMedia(userId, file));
      setValues((prev) => {
        const images = [...prev.images, ...urls].slice(0, MAX_PHOTOS);
        return { ...prev, images, image_url: prev.image_url ?? images[0] ?? null };
      });
      const first = picked[0];
      if (first) void autofill(first);
    } catch {
      toast.error("फोटो अपलोड नहीं हो पाई");
    } finally {
      setUploading(false);
    }
  }

  async function addVideo(file: File | undefined) {
    if (!file || !userId) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("वीडियो 50MB से छोटा होना चाहिए");
      return;
    }
    setUploading(true);
    try {
      set("video_url", await uploadProductMedia(userId, file));
      toast.success("वीडियो जुड़ गया");
    } catch {
      toast.error("वीडियो अपलोड नहीं हो पाया");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-card p-4 card-shadow"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!values.name.trim() || !values.price) {
          toast.error("नाम और दाम जरूरी है");
          return;
        }
        setSaving(true);
        try {
          await onSave({ ...values, image_url: values.image_url ?? values.images[0] ?? null });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "सेव नहीं हो पाया");
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2 className="text-sm font-bold">{product ? "प्रोडक्ट एडिट करें" : "नया प्रोडक्ट"}</h2>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-muted-foreground">
          फोटो ({values.images.length}/{MAX_PHOTOS}) — पहली फोटो से AI नाम-विवरण लिखेगा
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {values.images.map((url, i) => (
            <div key={url} className="relative overflow-hidden rounded-xl border border-border">
              <img src={url} alt={`photo ${i + 1}`} className="aspect-square w-full object-cover" />
              <button
                type="button"
                aria-label="remove photo"
                onClick={() =>
                  setValues((prev) => {
                    const images = prev.images.filter((x) => x !== url);
                    return { ...prev, images, image_url: images[0] ?? null };
                  })
                }
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-foreground/70 text-background"
              >
                <X className="size-4" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  मुख्य
                </span>
              )}
            </div>
          ))}
          {values.images.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-xs font-bold text-muted-foreground">
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5 text-primary" />}
              फोटो जोड़ें
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void addPhotos(e.target.files)}
              />
            </label>
          )}
        </div>

        {values.video_url ? (
          <div className="space-y-2 rounded-xl border border-border p-2">
            <video src={values.video_url} controls className="w-full rounded-lg" />
            <Button type="button" variant="outline" className="h-10 w-full" onClick={() => set("video_url", null)}>
              वीडियो हटाएँ
            </Button>
          </div>
        ) : (
          <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-3 text-sm font-bold text-muted-foreground">
            <Film className="size-5 text-primary" /> वीडियो जोड़ें (1)
            <input type="file" accept="video/*" className="hidden" onChange={(e) => void addVideo(e.target.files?.[0])} />
          </label>
        )}

        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full font-bold"
          disabled={aiBusy || values.images.length === 0}
          onClick={() => {
            aiDone.current = false;
            const url = values.images[0];
            if (!url) return;
            setAiBusy(true);
            void fetch(url)
              .then((r) => r.blob())
              .then((blob) => autofill(new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" })))
              .catch(() => toast.error("AI विवरण नहीं लिख पाया"))
              .finally(() => setAiBusy(false));
          }}
        >
          {aiBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          AI से नाम और विवरण लिखें
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground">नाम</Label>
        <Input className="h-12" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground">हिन्दी नाम</Label>
        <Input className="h-12" value={values.name_hi ?? ""} onChange={(e) => set("name_hi", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground">श्रेणी</Label>
        <div className="flex flex-wrap gap-2">
          {(categories ?? []).map((c) => {
            const active = values.category_id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => set("category_id", active ? null : c.id)}
                className={cn(
                  "min-h-10 rounded-xl border px-3 text-xs font-bold",
                  active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface",
                )}
              >
                {c.name_hi}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
          <Label className="text-xs font-bold text-muted-foreground">सेल प्राइस (₹)</Label>
          <Input
            inputMode="decimal"
            className="h-12"
            value={String(values.price)}
            onChange={(e) => set("price", Number(e.target.value) || 0)}
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

      {off > 0 && (
        <p className="rounded-xl bg-accent/10 px-3 py-2 text-sm font-bold text-accent">
          ग्राहक को {off}% छूट दिखेगी ({formatINR(values.mrp ?? 0)} → {formatINR(values.price)})
        </p>
      )}

      <ChipInput
        label="कलर वेरिएंट"
        placeholder="जैसे: लाल"
        values={values.colors}
        onChange={(next) => set("colors", next)}
      />
      <ChipInput label="साइज" placeholder="जैसे: M / 500g" values={values.sizes} onChange={(next) => set("sizes", next)} />

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground">विवरण</Label>
        <Textarea rows={3} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="h-12 flex-1 font-bold">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          सेव करें
        </Button>
        <Button type="button" variant="outline" className="h-12" onClick={onCancel}>
          रद्द
        </Button>
      </div>
    </form>
  );
}
