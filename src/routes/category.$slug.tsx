import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductGrid } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { localizedName, useI18n } from "@/lib/i18n";
import { cartQuery, categoriesQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — RRK Bazaar` },
      { name: "description", content: `RRK Bazaar पर ${params.slug} श्रेणी का सामान ऑर्डर करें।` },
      { property: "og:title", content: `${params.slug} — RRK Bazaar` },
      { property: "og:description", content: `RRK Bazaar पर ${params.slug} श्रेणी का सामान ऑर्डर करें।` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const categories = useQuery(categoriesQuery);
  const category = categories.data?.find((c) => c.slug === slug);
  const products = useQuery({ ...productsQuery({ categoryId: category?.id }), enabled: !!category });
  const { data: cart } = useQuery(cartQuery(user?.id));

  return (
    <AppShell>
      <header className="brand-gradient sticky top-0 z-30 flex items-center gap-2 px-3 pb-4 pt-5 text-primary-foreground">
        <Link to="/" aria-label="back" className="flex size-10 items-center justify-center rounded-xl bg-card/20">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="text-lg">{category ? localizedName(category, lang) : t("categories")}</h1>
      </header>
      <div className="px-4 py-4">
        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : products.data?.length ? (
          <ProductGrid products={products.data} cartItems={cart ?? []} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("no_results")}</p>
        )}
      </div>
    </AppShell>
  );
}
