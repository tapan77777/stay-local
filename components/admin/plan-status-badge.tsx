import { cn } from "@/lib/utils";
import { PLAN_STATUS_LABEL, type PlanStatus } from "@/lib/plan/types";

const styles: Record<PlanStatus, string> = {
  DRAFT: "bg-charcoal/[0.06] text-charcoal-soft",
  PREPARING: "bg-saffron/15 text-[#8a6516]",
  READY: "bg-brand-green-light text-brand-green-dark",
  ACTIVE: "bg-brand-green text-white",
  COMPLETED: "bg-charcoal/[0.08] text-muted",
  DISABLED: "bg-terracotta/15 text-terracotta",
};

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        styles[status]
      )}
    >
      {PLAN_STATUS_LABEL[status]}
    </span>
  );
}
