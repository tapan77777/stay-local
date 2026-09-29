import Link from "next/link";
import { Button } from "@/components/ui/button";
import { primaryCta } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
  href?: string;
};

export function ConsultCta({
  className,
  size = "lg",
  variant = "primary",
  label = primaryCta.label,
  href = primaryCta.href,
}: Props) {
  return (
    <Button asChild variant={variant} size={size} className={cn(className)}>
      <Link href={href as never} prefetch>
        {label}
        <span aria-hidden className="ml-0.5 -mr-0.5 opacity-70 transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </Button>
  );
}
