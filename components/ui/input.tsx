import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-border bg-white px-4 py-2 text-sm text-charcoal placeholder:text-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
