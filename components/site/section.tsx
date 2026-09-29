import * as React from "react";
import { cn } from "@/lib/utils";

export function Section({
  className,
  as: Tag = "section",
  tone = "cream",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  tone?: "cream" | "warm" | "white" | "charcoal";
}) {
  return (
    <Tag
      className={cn(
        "py-20 sm:py-24 lg:py-28",
        tone === "cream" && "bg-cream text-charcoal",
        tone === "warm" && "bg-cream-warm text-charcoal",
        tone === "white" && "bg-card text-charcoal",
        tone === "charcoal" && "bg-charcoal text-cream",
        className
      )}
      {...props}
    />
  );
}

export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "font-serif text-3xl leading-[1.1] tracking-tight text-charcoal sm:text-4xl lg:text-5xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionLede({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-5 max-w-2xl text-lg leading-relaxed text-muted", className)}>
      {children}
    </p>
  );
}
