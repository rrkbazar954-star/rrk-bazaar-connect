import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ImageOff } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { addToCart, formatINR, setCartQty, type Product } from "@/lib/queries";
import { Button } from "@/components/ui/button";

type Props = { product: Product; cartItem?: { id: string; qty: number } };

export function ProductCard({ product, cartItem }: Props) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const title = lang === "en" ? product.name : product.name_hi || product.name;

  const mutate = useMutation({
    mutationFn: async (nextQty: number) => {
      if (!user) throw new Error("auth");
      if (cartItem) await setCartQty(cartItem.id, nextQty);
      else await addToCart(user.id, product.id, 1);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      if (!cartItem) toast.success(t("added"));
    },
    onError: (error: Error) => {
      if (error.message === "auth") toast.error(t("login_required"));
      else toast.error(error.message);
    },
  });

  const soldOut = product.stock <= 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card card-shadow">
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="flex aspect-square items-center justify-center bg-surface">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={title}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <ImageOff className="size-8 text-muted-foreground" />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <Link to="/product/$id" params={{ id: product.id }} className="line-clamp-2 text-sm font-semibold leading-snug">
          {title}
        </Link>
        <p className="text-xs text-muted-foreground">{product.unit}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div>
            <p className="text-base font-bold">{formatINR(product.price)}</p>
            {product.mrp && product.mrp > product.price && (
              <p className="text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</p>
            )}
          </div>
          {soldOut ? (
            <span className="rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              {t("out_of_stock")}
            </span>
          ) : cartItem ? (
            <div className="flex items-center gap-1 rounded-xl bg-primary p-0.5 text-primary-foreground">
              <button
                type="button"
                aria-label="minus"
                className="flex size-8 items-center justify-center"
                onClick={() => mutate.mutate(cartItem.qty - 1)}
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-5 text-center text-sm font-bold">{cartItem.qty}</span>
              <button
                type="button"
                aria-label="plus"
                className="flex size-8 items-center justify-center"
                onClick={() => mutate.mutate(cartItem.qty + 1)}
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <Button size="sm" className="h-9 px-4 font-bold" onClick={() => mutate.mutate(1)} disabled={mutate.isPending}>
              {t("add")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  cartItems,
}: {
  products: Product[];
  cartItems?: Array<{ id: string; qty: number; product_id: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          cartItem={cartItems?.find((item) => item.product_id === product.id)}
        />
      ))}
    </div>
  );
}
