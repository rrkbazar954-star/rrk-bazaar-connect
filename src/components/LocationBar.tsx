import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ChevronDown, Crosshair, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useLocationCtx } from "@/lib/location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function LocationBar() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { location, setLocation, requestGps, gpsBusy } = useLocationCtx();
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState({ line1: "", city: "", pincode: "" });

  const { data: addresses } = useQuery({
    queryKey: ["addresses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  async function useGps() {
    const result = await requestGps();
    if (result.ok) {
      setOpen(false);
      toast.success(t("use_gps"));
    } else {
      toast.error(t("gps_denied"));
    }
  }

  async function saveManual() {
    if (!manual.line1 || !manual.city || !manual.pincode) {
      toast.error(t("manual_location"));
      return;
    }
    setLocation({ label: "Home", ...manual });
    if (user) {
      await supabase.from("addresses").insert({ user_id: user.id, label: "Home", ...manual });
    }
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-primary-foreground"
        >
          <MapPin className="size-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide opacity-80">
              {t("deliver_to")}
            </span>
            <span className="block truncate text-sm font-bold">
              {location ? `${location.line1}${location.city ? `, ${location.city}` : ""}` : t("select_location")}
            </span>
          </span>
          <ChevronDown className="size-4 opacity-80" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t("select_location")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-8">
          <Button className="h-14 w-full justify-start gap-3 text-base" onClick={useGps} disabled={gpsBusy}>
            <Crosshair className="size-5" />
            {t("use_gps")}
          </Button>

          {!!addresses?.length && (
            <section>
              <h3 className="mb-2 text-sm font-bold text-muted-foreground">{t("saved_addresses")}</h3>
              <ul className="space-y-2">
                {addresses.map((address) => (
                  <li key={address.id}>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-border bg-card p-3 text-left"
                      onClick={() => {
                        setLocation({
                          addressId: address.id,
                          label: address.label,
                          line1: address.line1,
                          city: address.city,
                          pincode: address.pincode,
                          lat: address.lat ?? undefined,
                          lng: address.lng ?? undefined,
                        });
                        setOpen(false);
                      }}
                    >
                      <p className="text-sm font-bold">{address.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.line1}, {address.city} - {address.pincode}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <PencilLine className="size-4" /> {t("manual_location")}
            </h3>
            <Input
              className="h-12"
              placeholder="House / street"
              value={manual.line1}
              onChange={(event) => setManual({ ...manual, line1: event.target.value })}
            />
            <Input
              className="h-12"
              placeholder="City"
              value={manual.city}
              onChange={(event) => setManual({ ...manual, city: event.target.value })}
            />
            <Input
              className="h-12"
              inputMode="numeric"
              placeholder="Pincode"
              value={manual.pincode}
              onChange={(event) => setManual({ ...manual, pincode: event.target.value })}
            />
            <Button variant="secondary" className="h-12 w-full" onClick={saveManual}>
              {t("save")}
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
