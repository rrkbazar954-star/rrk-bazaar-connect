import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusCircle, Store } from "lucide-react";


import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "प्रोफाइल — RRK Bazaar" },
      { name: "description", content: "अपनी जानकारी, भाषा और खाता सेटिंग देखें — RRK Bazaar." },
      { property: "og:title", content: "प्रोफाइल — RRK Bazaar" },
      { property: "og:description", content: "अपनी जानकारी, भाषा और खाता सेटिंग देखें — RRK Bazaar." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { user, roles, signOut } = useAuth();

  return (
    <AppShell>
      <PageHeader title={t("profile")} subtitle={user?.email ?? undefined} />
      <div className="space-y-5 p-4">
        {!user ? (
          <Button asChild className="h-12 w-full font-bold">
            <Link to="/auth">{t("login")}</Link>
          </Button>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
              <p className="text-sm font-bold">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">{roles.join(", ") || "customer"}</p>
            </section>
            <Button asChild variant="secondary" className="h-12 w-full">
              <Link to="/orders">{t("orders")}</Link>
            </Button>
          </>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground">दुकान / Seller</h2>
          <Button asChild variant="secondary" className="h-12 w-full justify-start">
            <Link to="/shop">
              <Store className="mr-2 size-4" /> My Shop
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 w-full justify-start">
            <Link to="/shop/create">
              <PlusCircle className="mr-2 size-4" /> दुकान बनाएँ
            </Link>
          </Button>
        </section>


        <section className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground">{t("language")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["hi", "en", "bn", "bho"] as const).map((code) => (
              <Button
                key={code}
                variant={lang === code ? "default" : "outline"}
                className="h-12"
                onClick={() => setLang(code)}
              >
                {code === "hi" ? "हिन्दी" : code === "en" ? "English" : code === "bn" ? "বাংলা" : "भोजपुरी"}
              </Button>
            ))}
          </div>
        </section>

        {user && (
          <Button variant="outline" className="h-12 w-full" onClick={() => void signOut()}>
            {t("logout")}
          </Button>
        )}
      </div>
    </AppShell>
  );
}
