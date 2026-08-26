import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, ClipboardList, Store, UserCog } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const items = [
  { to: "/shop", icon: Store, label: "दुकान" },
  { to: "/shop/products", icon: Boxes, label: "प्रोडक्ट" },
  { to: "/shop/orders", icon: ClipboardList, label: "ऑर्डर" },
  { to: "/shop/profile", icon: UserCog, label: "प्रोफाइल" },
] as const;

function SellerNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1">
        {items.map(({ to, icon: Icon, label }) => {
          const active = to === "/shop" ? pathname === "/shop" || pathname === "/shop/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[11px] font-semibold transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.6 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Seller-only app frame: own bottom navigation, separate from the customer app. */
export function SellerShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-24">
      {children}
      {nav && <SellerNav />}
    </div>
  );
}
