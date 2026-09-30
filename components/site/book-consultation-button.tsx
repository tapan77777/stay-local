"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CAL_NAMESPACE = "consultation";
// Cal.com event link in `<username>/<event-slug>` form. Overridable via
// NEXT_PUBLIC_CAL_LINK so the Cal-side event URL can be swapped without a
// code change. Fallback points at the live StayLocal event so nothing 404s
// if the env is missing.
const CAL_LINK =
  process.env.NEXT_PUBLIC_CAL_LINK ??
  "tapan-naik-ekfpil/staylocal-india-travel-consultation";

type Props = {
  className?: string;
  size?: "md" | "lg" | "xl";
  label?: string;
};

export function BookConsultationButton({
  className,
  size = "xl",
  label = "Choose a time",
}: Props) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      if (cancelled) return;
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        cssVarsPerTheme: {
          light: {
            "cal-brand": "#1D9E75",
            "cal-brand-emphasis": "#166f56",
          },
          dark: {
            "cal-brand": "#1D9E75",
            "cal-brand-emphasis": "#166f56",
          },
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Button
      type="button"
      variant="primary"
      size={size}
      className={cn("group", className)}
      data-cal-link={CAL_LINK}
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-config='{"layout":"month_view"}'
      aria-label={`${label} — opens a booking dialog`}
    >
      {label}
      <ArrowRight
        size={16}
        className="transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Button>
  );
}
