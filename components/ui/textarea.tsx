import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[110px] w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-charcoal placeholder:text-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
