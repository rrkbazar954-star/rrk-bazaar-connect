import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Camera,
  Carrot,
  Cookie,
  Milk,
  Mic,
  Pill,
  PlugZap,
  Search as SearchIcon,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  SprayCan,
  Truck,
  Wallet,
  Wheat,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { LocationBar } from "@/components/LocationBar";
import { ProductGrid } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth";
import { localizedName, useI18n } from "@/lib/i18n";
import { cartQuery, categoriesQuery, productsQuery } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/icon-master.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RRK Bazaar — आपकी जरूरत, आपके पास।" },
      {
        name: "description",
        content:
          "RRK Bazaar से किराना, सब्ज़ी, दूध और दवा घर तक मंगाएँ। हिन्दी, English, বাংলা और भोजपुरी में खरीदारी करें।",
      },
      { property: "og:title", content: "RRK Bazaar — आपकी जरूरत, आपके पास।" },
      {
        property: "og:description",
        content: "अपने मोहल्ले की दुकानों से किराना, सब्ज़ी और दवा तेज़ डिलीवरी के साथ।",
      },
    ],
  }),
  component: Home,
});

const categoryIcons: Record<string, { icon: typeof Wheat; className: string }> = {
  grocery: { icon: Wheat, className: "bg-primary" },
  vegetables: { icon: Carrot, className: "bg-accent" },
  dairy: { icon: Milk, className: "bg-secondary" },
  snacks: { icon: Cookie, className: "bg-primary/85" },
  household: { icon: SprayCan, className: "bg-accent/85" },
  "personal-care": { icon: Sparkles, className: "bg-secondary/85" },
  medicine: { icon: Pill, className: "bg-primary/70" },
  electronics: { icon: PlugZap, className: "bg-accent/70" },
};

const trustItems = [
  { icon: Truck, hi: "तेज़ डिलीवरी", en: "Fast delivery" },
  { icon: Wallet, hi: "कैश ऑन डिलीवरी", en: "Cash on delivery" },
  { icon: ShieldCheck, hi: "भरोसेमंद दुकानें", en: "Trusted shops" },
];

function Home() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const categories = useQuery(categoriesQuery);
  const products = useQuery(productsQuery({ limit: 20 }));
  const { data: cart } = useQuery(cartQuery(user?.id));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    void navigate({ to: "/search", search: { q: term.trim() } });
  }

  return (
    <AppShell>
      <header className="brand-gradient sticky top-0 z-30 pb-4 pt-3 text-primary-foreground">
        <div className="flex items-center gap-2 px-4">
          <img src={logo} alt="" width={36} height={36} className="size-9 rounded-xl" />
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight">RRK Bazaar</p>
            <p className="truncate text-[11px] opacity-90">आपकी जरूरत, आपके पास।</p>
          </div>
        </div>
        <LocationBar />

        <form onSubmit={submit} className="mx-4 mt-1 flex items-center gap-2 rounded-2xl bg-card p-1.5 float-shadow">
          <SearchIcon className="ml-2 size-5 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("search_placeholder")}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none"
            aria-label={t("search")}
          />
          <Link
            to="/search"
            search={{ mode: "voice" }}
            aria-label={t("voice_search")}
            className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
          >
            <Mic className="size-5" />
          </Link>
          <Link
            to="/search"
            search={{ mode: "photo" }}
            aria-label={t("photo_search")}
            className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
          >
            <Camera className="size-5" />
          </Link>
        </form>
      </header>

      <section className="px-4 pt-4">
        <div className="brand-gradient rounded-2xl px-5 py-6 text-center text-primary-foreground float-shadow">
          <h2 className="text-xl font-extrabold leading-snug">
            {lang === "en" ? "Welcome to RRK Bazaar" : "RRK Bazaar में स्वागत है"}
          </h2>
          <p className="mt-1 text-sm opacity-90">आपकी जरूरत, आपके पास।</p>
        </div>
      </section>

      <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        {trustItems.map((item) => (
          <li
            key={item.en}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-surface-foreground"
          >
            <item.icon className="size-4 text-accent" />
            {lang === "en" ? item.en : item.hi}
          </li>
        ))}
      </ul>

      <section className="mt-5 px-4">
        <h2 className="text-base font-extrabold">{t("categories")}</h2>
        <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
          {categories.isLoading &&
            Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}
          {categories.data?.map((category) => {
            const meta = categoryIcons[category.slug] ?? { icon: ShoppingBasket, className: "bg-primary" };
            const Icon = meta.icon;
            return (
              <Link
                key={category.id}
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <span
                  className={`flex size-16 items-center justify-center rounded-full text-primary-foreground card-shadow ${meta.className}`}
                >
                  <Icon className="size-7" strokeWidth={2.2} />
                </span>
                <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
                  {localizedName(category, lang)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-6 px-4">
        <h2 className="text-base font-extrabold">{t("popular")}</h2>
        <div className="mt-3">
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : (
            <ProductGrid products={products.data ?? []} cartItems={cart ?? []} />
          )}
        </div>
      </section>
    </AppShell>
  );
}
