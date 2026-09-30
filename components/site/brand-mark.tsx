import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
  variant = "dark",
}: {
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
}) {
  const light = variant === "light";
  return (
    <Link
      href="/"
      aria-label="StayLocal — trusted India travel advisor"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full text-white shadow-sm transition-transform group-hover:scale-[1.03]",
          light ? "bg-brand-green-dark" : "bg-brand-green"
        )}
      >
        <span className="font-serif text-[15px] leading-none">S</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-serif text-lg tracking-tight",
              light ? "text-cream" : "text-charcoal"
            )}
          >
            StayLocal
          </span>
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em]",
              light ? "text-cream/70" : "text-muted"
            )}
          >
            India, Your Way
          </span>
        </span>
      )}
    </Link>
  );
}
