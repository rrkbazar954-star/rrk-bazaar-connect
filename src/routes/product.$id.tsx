import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ImageOff, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RatingInput, RatingStars } from "@/components/Rating";
import { Textarea } from "@/components/ui/textarea";
import { rateProduct, reviewsQuery, trackProductView } from "@/lib/reviews";
import { discountPct } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { addToCart, formatINR, productQuery } from "@/lib/queries";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "प्रोडक्ट — RRK Bazaar" },
      { name: "description", content: "RRK Bazaar पर प्रोडक्ट की जानकारी, कीमत और डिलीवरी।" },
      { property: "og:title", content: "प्रोडक्ट — RRK Bazaar" },
      { property: "og:description", content: "RRK Bazaar पर प्रोडक्ट की जानकारी, कीमत और डिलीवरी।" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: product, isLoading } = useQuery(productQuery(id));
  const { data: reviews } = useQuery(reviewsQuery(id));
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    void trackProductView(id);
  }, [id]);

  const myReview = (reviews ?? []).find((r) => r.user_id === user?.id);
  useEffect(() => {
    if (myReview) {
      setStars(myReview.rating);
      setComment(myReview.comment ?? "");
    }
  }, [myReview?.id]);

  const rate = useMutation({
    mutationFn: async (value: number) => {
      if (!user) throw new Error("auth");
      await rateProduct(user.id, id, value, comment);
    },
    onSuccess: () => {
      toast.success("रेटिंग सेव हो गई");
      void queryClient.invalidateQueries({ queryKey: ["product-reviews", id] });
      void queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
    onError: (error: Error) => toast.error(error.message === "auth" ? "कुछ सेकंड बाद फिर कोशिश करें" : error.message),
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      await addToCart(user.id, id, 1);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("added"));
    },
    onError: (error: Error) => {
      if (error.message === "auth") toast.error("कुछ सेकंड बाद फिर कोशिश करें");
      else toast.error(error.message);
    },
  });

  const title = product ? (lang === "en" ? product.name : product.name_hi || product.name) : "";

  return (
    <AppShell>
      <header className="brand-gradient sticky top-0 z-30 flex items-center gap-2 px-3 pb-4 pt-5 text-primary-foreground">
        <Link to="/" aria-label="back" className="flex size-10 items-center justify-center rounded-xl bg-card/20">
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="truncate text-lg">{title || "RRK Bazaar"}</h1>
      </header>

      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      ) : !product ? (
        <p className="p-4 text-sm text-muted-foreground">{t("no_results")}</p>
      ) : (
        <>
          <div className="flex aspect-square items-center justify-center bg-surface">
            {product.image_url ? (
              <img src={product.image_url} alt={title} className="size-full object-cover" width={600} height={600} />
            ) : (
              <ImageOff className="size-12 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2 p-4">
            <h2 className="text-xl">{title}</h2>
            <p className="text-sm text-muted-foreground">{product.unit}</p>
            <RatingStars value={Number(product.rating_avg ?? 0)} count={product.rating_count ?? 0} size="md" />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold">{formatINR(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-sm text-muted-foreground line-through">{formatINR(product.mrp)}</span>
              )}
              {discountPct(product.mrp, product.price) > 0 && (
                <span className="rounded-lg bg-accent px-1.5 py-0.5 text-xs font-extrabold text-accent-foreground">
                  {discountPct(product.mrp, product.price)}% OFF
                </span>
              )}
            </div>
            {product.description && <p className="pt-2 text-sm leading-relaxed">{product.description}</p>}
            <p className="pt-1 text-xs font-semibold text-accent">
              {product.stock > 0 ? `In stock: ${product.stock}` : t("out_of_stock")}
            </p>
          </div>

          <section className="space-y-3 border-t border-border p-4">
            <h3 className="text-sm font-bold">रेटिंग दें</h3>
            <RatingInput value={stars} onChange={setStars} disabled={rate.isPending} />
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="अपना अनुभव लिखें (वैकल्पिक)"
              rows={2}
            />
            <Button
              variant="secondary"
              className="h-11 w-full font-bold"
              disabled={stars < 1 || rate.isPending}
              onClick={() => rate.mutate(stars)}
            >
              {myReview ? "रेटिंग अपडेट करें" : "रेटिंग सेव करें"}
            </Button>

            <ul className="space-y-2 pt-2">
              {(reviews ?? []).map((review) => (
                <li key={review.id} className="rounded-2xl border border-border bg-card p-3">
                  <RatingStars value={review.rating} />
                  {review.comment && <p className="mt-1 text-xs leading-relaxed">{review.comment}</p>}
                </li>
              ))}
            </ul>
          </section>

          <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-md border-t border-border bg-card p-3 safe-bottom">
            <Button
              className="h-14 w-full gap-2 text-base font-bold"
              disabled={product.stock <= 0 || add.isPending}
              onClick={() => add.mutate()}
            >
              <ShoppingCart className="size-5" />
              {product.stock > 0 ? t("add") : t("out_of_stock")}
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
