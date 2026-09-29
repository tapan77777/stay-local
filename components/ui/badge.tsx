import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "green" | "outline" | "terracotta";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em]",
        variant === "default" && "bg-charcoal/[0.06] text-charcoal",
        variant === "green" && "bg-brand-green-light text-brand-green-dark",
        variant === "outline" && "border border-border text-charcoal/70",
        variant === "terracotta" && "bg-terracotta/10 text-terracotta",
        className
      )}
      {...props}
    />
  );
}
