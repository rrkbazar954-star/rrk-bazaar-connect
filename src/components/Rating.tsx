import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only star rating with optional review count. */
export function RatingStars({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const rounded = Math.round(value);
  const star = size === "md" ? "size-4" : "size-3";
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(star, i <= rounded ? "fill-accent text-accent" : "text-muted-foreground/40")}
        />
      ))}
      <span className={cn("ml-1 font-semibold", size === "md" ? "text-xs" : "text-[10px]")}>
        {value > 0 ? value.toFixed(1) : "—"}
        {typeof count === "number" && count > 0 ? ` (${count})` : ""}
      </span>
    </span>
  );
}

/** Tappable 1–5 star input. */
export function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          aria-label={`${i} star`}
          onClick={() => onChange(i)}
          className="flex size-10 items-center justify-center"
        >
          <Star className={cn("size-7", i <= value ? "fill-accent text-accent" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}
