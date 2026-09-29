import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="StayLocal — trusted India travel advisor"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-full bg-brand-green text-white shadow-sm transition-transform group-hover:scale-[1.03]"
      >
        <span className="font-serif text-[15px] leading-none">S</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-lg tracking-tight text-charcoal">
            StayLocal
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            India, Your Way
          </span>
        </span>
      )}
    </Link>
  );
}
