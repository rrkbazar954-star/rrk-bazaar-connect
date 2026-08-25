import { useEffect, useState } from "react";
import { Crosshair, ImagePlus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { categoriesQuery } from "@/lib/queries";
import {
  PAYMENT_OPTIONS,
  resolveShopImage,
  uploadShopImage,
  type Shop,
  type ShopFormValues,
} from "@/lib/shop";
import { cn } from "@/lib/utils";

const empty: ShopFormValues = {
  owner_name: "",
  name: "",
  description: "",
  category_id: null,
  image_url: null,
  phone: "",
  address: "",
  area: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  lat: null,
  lng: null,
  opens_at: "08:00",
  closes_at: "21:00",
  delivery_radius_km: 5,
  min_order_amount: 0,
  payment_options: ["cod"],
  has_gst: false,
  gst_number: "",
  upi_id: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function ShopForm({
  shop,
  submitLabel,
  onSubmit,
}: {
  shop?: Shop | undefined;
  submitLabel: string;
  onSubmit: (values: ShopFormValues) => Promise<void>;
}) {
  const { lang } = useI18n();
  const { user } = useAuth();
  const { data: categories } = useQuery(categoriesQuery);
  const [values, setValues] = useState<ShopFormValues>(empty);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shop) return;
    const { id: _id, owner_id: _owner, commission_pct: _c, is_active: _a, ...rest } = shop;
    setValues({ ...empty, ...rest });
    void resolveShopImage(shop.image_url).then(setPreview);
  }, [shop]);

  function set<K extends keyof ShopFormValues>(key: K, value: ShopFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function pickPhoto(file: File | undefined) {
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = await uploadShopImage(user.id, file);
      set("image_url", path);
      setPreview(URL.createObjectURL(file));
    } catch {
      toast.error(lang === "en" ? "Photo upload failed" : "फोटो अपलोड नहीं हो पाई");
    } finally {
      setUploading(false);
    }
  }

  function useGps(silent = false) {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValues((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        if (!silent) toast.success(lang === "en" ? "Location captured" : "लोकेशन मिल गई");
      },
      () => {
        if (!silent) toast.info(lang === "en" ? "Enter the address manually" : "पता खुद भर दें");
      },
      { timeout: 12000 },
    );
  }

  // New shops capture the live GPS location automatically.
  useEffect(() => {
    if (shop) return;
    useGps(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name?.trim() || !values.owner_name?.trim() || !values.phone?.trim()) {
      toast.error(lang === "en" ? "Name, owner and mobile are required" : "दुकान का नाम, मालिक और मोबाइल जरूरी है");
      return;
    }
    if (values.has_gst && !values.gst_number?.trim()) {
      toast.error(lang === "en" ? "Enter the GST number" : "GST नंबर भरें");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...values, gst_number: values.has_gst ? values.gst_number : null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const en = lang === "en";

  return (
    <form onSubmit={submit} className="space-y-5 p-4">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 card-shadow">
        <h2 className="text-sm font-bold">{en ? "Owner & shop" : "मालिक और दुकान"}</h2>
        <Field label={en ? "Owner / seller name" : "मालिक का नाम"}>
          <Input value={values.owner_name ?? ""} onChange={(e) => set("owner_name", e.target.value)} className="h-12" />
        </Field>
        <Field label={en ? "Mobile number" : "मोबाइल नंबर"}>
          <Input
            inputMode="tel"
            value={values.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            className="h-12"
          />
        </Field>
        <Field label={en ? "Shop name" : "दुकान का नाम"}>
          <Input value={values.name} onChange={(e) => set("name", e.target.value)} className="h-12" />
        </Field>
        <Field label={en ? "Shop photo / logo" : "दुकान की फोटो / लोगो"}>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-3 py-2 text-sm font-semibold">
            {preview ? (
              <img src={preview} alt={values.name || "shop"} className="size-10 rounded-lg object-cover" />
            ) : uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5 text-primary" />
            )}
            <span>{en ? "Choose photo" : "फोटो चुनें"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void pickPhoto(e.target.files?.[0])}
            />
          </label>
        </Field>
        <Field label={en ? "Shop description" : "दुकान का विवरण"}>
          <Textarea
            rows={3}
            value={values.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>
        <Field label={en ? "Shop category" : "दुकान की श्रेणी"}>
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
                  {en ? c.name_en : lang === "bn" ? c.name_bn : lang === "bho" ? c.name_bho : c.name_hi}
                </button>
              );
            })}
          </div>
        </Field>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 card-shadow">
        <h2 className="text-sm font-bold">{en ? "Address" : "पता"}</h2>
        <Field label={en ? "Full address" : "पूरा पता"}>
          <Textarea rows={2} value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={en ? "Area" : "एरिया / मोहल्ला"}>
            <Input value={values.area ?? ""} onChange={(e) => set("area", e.target.value)} className="h-12" />
          </Field>
          <Field label={en ? "City / Town" : "शहर / कस्बा"}>
            <Input value={values.city ?? ""} onChange={(e) => set("city", e.target.value)} className="h-12" />
          </Field>
          <Field label={en ? "District" : "जिला"}>
            <Input value={values.district ?? ""} onChange={(e) => set("district", e.target.value)} className="h-12" />
          </Field>
          <Field label={en ? "State" : "राज्य"}>
            <Input value={values.state ?? ""} onChange={(e) => set("state", e.target.value)} className="h-12" />
          </Field>
          <Field label={en ? "Pincode" : "पिनकोड"}>
            <Input
              inputMode="numeric"
              value={values.pincode ?? ""}
              onChange={(e) => set("pincode", e.target.value)}
              className="h-12"
            />
          </Field>
        </div>
        <Button type="button" variant="secondary" className="h-12 w-full" onClick={() => useGps()}>
          <Crosshair className="mr-2 size-4" />
          {values.lat != null
            ? `${values.lat.toFixed(4)}, ${values.lng?.toFixed(4)}`
            : en
              ? "Use shop GPS location"
              : "दुकान की GPS लोकेशन लें"}
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 card-shadow">
        <h2 className="text-sm font-bold">{en ? "Timing & delivery" : "समय और डिलीवरी"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label={en ? "Opening time" : "खुलने का समय"}>
            <Input
              type="time"
              value={values.opens_at ?? ""}
              onChange={(e) => set("opens_at", e.target.value)}
              className="h-12"
            />
          </Field>
          <Field label={en ? "Closing time" : "बंद होने का समय"}>
            <Input
              type="time"
              value={values.closes_at ?? ""}
              onChange={(e) => set("closes_at", e.target.value)}
              className="h-12"
            />
          </Field>
          <Field label={en ? "Delivery radius (km)" : "डिलीवरी एरिया (किमी)"}>
            <Input
              inputMode="decimal"
              value={String(values.delivery_radius_km)}
              onChange={(e) => set("delivery_radius_km", Number(e.target.value) || 0)}
              className="h-12"
            />
          </Field>
          <Field label={en ? "Minimum order (₹)" : "न्यूनतम ऑर्डर (₹)"}>
            <Input
              inputMode="decimal"
              value={String(values.min_order_amount)}
              onChange={(e) => set("min_order_amount", Number(e.target.value) || 0)}
              className="h-12"
            />
          </Field>
        </div>
        <Field label={en ? "Payment options" : "पेमेंट के तरीके"}>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = values.payment_options.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    set(
                      "payment_options",
                      active
                        ? values.payment_options.filter((v) => v !== opt.value)
                        : [...values.payment_options, opt.value],
                    )
                  }
                  className={cn(
                    "min-h-10 rounded-xl border px-3 text-xs font-bold",
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface",
                  )}
                >
                  {en ? opt.en : opt.hi}
                </button>
              );
            })}
          </div>
        </Field>
        {values.payment_options.includes("upi") && (
          <Field label={en ? "Your UPI ID (to receive payments)" : "आपकी UPI ID (पेमेंट लेने के लिए)"}>
            <Input
              placeholder="name@upi"
              value={values.upi_id ?? ""}
              onChange={(e) => set("upi_id", e.target.value.trim())}
              className="h-12"
            />
          </Field>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 card-shadow">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">{en ? "GST registered?" : "GST रजिस्टर्ड है?"}</h2>
            <p className="text-xs text-muted-foreground">
              {en ? "Optional — skip if not required" : "जरूरी नहीं — न हो तो छोड़ दें"}
            </p>
          </div>
          <Switch checked={values.has_gst} onCheckedChange={(v) => set("has_gst", v)} />
        </div>
        {values.has_gst && (
          <Field label={en ? "GSTIN" : "GST नंबर"}>
            <Input
              value={values.gst_number ?? ""}
              onChange={(e) => set("gst_number", e.target.value.toUpperCase())}
              className="h-12"
            />
          </Field>
        )}
      </section>

      <Button type="submit" disabled={saving} className="h-12 w-full font-bold">
        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
