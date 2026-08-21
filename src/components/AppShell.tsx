import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { cartQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, key: "home" },
  { to: "/search", icon: Search, key: "search" },
  { to: "/cart", icon: ShoppingCart, key: "cart" },
  { to: "/orders", icon: ClipboardList, key: "orders" },
  { to: "/profile", icon: User, key: "profile" },
] as const;

export function BottomNav() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: cart } = useQuery(cartQuery(user?.id));
  const cartCount = (cart ?? []).reduce((sum, item) => sum + item.qty, 0);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1">
        {items.map(({ to, icon: Icon, key }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={active ? 2.6 : 2} />
                  {key === "cart" && cartCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </span>
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-24">
      {children}
      {nav && <BottomNav />}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="brand-gradient sticky top-0 z-30 px-4 pb-4 pt-5 text-primary-foreground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm opacity-90">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
