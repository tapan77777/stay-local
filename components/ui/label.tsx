import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-xs font-medium uppercase tracking-[0.1em] text-charcoal/70",
        className
      )}
      {...props}
    />
  );
});
Label.displayName = "Label";
