import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ServiceTier } from "@/lib/services";
import { cn } from "@/lib/utils";

export function ServiceCard({
  service,
  compact = false,
}: {
  service: ServiceTier;
  compact?: boolean;
}) {
  const includes = service.includes.slice(0, compact ? 6 : 8);

  return (
    <Card
      id={service.id}
      className={cn(
        "relative flex h-full flex-col",
        compact ? "p-6" : "p-7 lg:p-8",
        service.emphasized &&
          "border-brand-green/40 bg-brand-green-light/40 ring-1 ring-brand-green/10"
      )}
    >
      {service.emphasized && (
        <Badge variant="green" className={cn("absolute -top-3", compact ? "left-6" : "left-7 lg:left-8")}>
          Recommended first step
        </Badge>
      )}

      <p className="eyebrow">{service.eyebrow}</p>
      <h3
        className={cn(
          "mt-2 font-serif leading-tight text-charcoal",
          compact ? "text-xl" : "text-2xl lg:text-[28px]"
        )}
      >
        {service.name}
      </h3>
      <p
        className={cn(
          "mt-2 leading-snug text-muted",
          compact ? "text-[13px]" : "text-[15px] leading-relaxed"
        )}
      >
        {service.tagline}
      </p>

      <div className="mt-5 flex items-baseline gap-2">
        <span
          className={cn(
            "font-serif text-charcoal",
            compact ? "text-[32px] leading-none" : "text-4xl"
          )}
        >
          {service.price}
        </span>
        <span className={cn("text-muted", compact ? "text-[11px]" : "text-xs")}>
          {service.duration}
        </span>
      </div>
      {service.priceNote && (
        <p
          className={cn(
            "mt-1 text-muted",
            compact ? "text-[10.5px]" : "text-[11px]"
          )}
        >
          {service.priceNote}
        </p>
      )}

      {!compact && (
        <p className="mt-5 text-sm font-medium text-charcoal">
          Best for:{" "}
          <span className="font-normal text-muted">{service.bestFor}</span>
        </p>
      )}

      <ul
        className={cn(
          compact ? "mt-4 space-y-1.5" : "mt-5 space-y-2"
        )}
      >
        {includes.map((item) => (
          <li
            key={item}
            className={cn(
              "flex items-start gap-2.5 text-charcoal-soft",
              compact ? "text-[13px] leading-snug" : "text-[15px] leading-relaxed"
            )}
          >
            <Check
              className="mt-[3px] shrink-0 text-brand-green"
              size={compact ? 14 : 16}
              strokeWidth={2.5}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className={cn("mt-auto", compact ? "pt-5" : "pt-6")}>
        <Button
          asChild
          variant={service.emphasized ? "primary" : "secondary"}
          size={compact ? "md" : "lg"}
          className="w-full"
        >
          <Link href={service.ctaHref as never}>{service.ctaLabel}</Link>
        </Button>
      </div>
    </Card>
  );
}
