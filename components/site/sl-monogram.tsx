import { cn } from "@/lib/utils";

/**
 * StayLocal "SL" monogram — italic S stacked over an upright L, drawn in
 * the project's serif typeface. Inherits `currentColor`, so a parent can
 * place it inside any coloured circle without extra configuration.
 */
export function StayLocalMonogram({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={cn("block", className)}
    >
      {title ? <title>{title}</title> : null}
      <g
        fill="currentColor"
        fontFamily="var(--font-serif, Georgia, serif)"
        fontWeight={500}
      >
        <text x="3.6" y="13.4" fontSize="12.5" fontStyle="italic">
          S
        </text>
        <text x="10.8" y="20.4" fontSize="12.5">
          L
        </text>
      </g>
    </svg>
  );
}
