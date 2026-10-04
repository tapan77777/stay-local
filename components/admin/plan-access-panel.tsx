import { CopyField } from "./copy-field";
import { Button } from "@/components/ui/button";
import {
  rotatePlanTokenAction,
  togglePlanDisabledAction,
} from "@/lib/plan/actions";
import type { Plan } from "@/lib/plan/types";

function buildPlanUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${base}/plan/${token}`;
}

export function PlanAccessPanel({ plan }: { plan: Plan }) {
  const url = buildPlanUrl(plan.privateToken);
  const rotate = rotatePlanTokenAction.bind(null, plan.id);
  const toggle = togglePlanDisabledAction.bind(null, plan.id);
  const disabled = plan.status === "DISABLED";
  return (
    <div className="rounded-2xl border border-border bg-white p-6 text-sm">
      <h2 className="mb-3 font-serif text-lg text-charcoal">Customer access</h2>
      <p className="mb-4 text-xs text-muted">
        Share this private link with the traveler. The access code at the end is
        what they type on the access screen.
      </p>
      <div className="space-y-3">
        <CopyField label="Private link" value={url || `/plan/${plan.privateToken}`} />
        <CopyField label="Access code" value={plan.privateToken} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form action={rotate}>
          <Button type="submit" variant="secondary" size="sm">
            Rotate code
          </Button>
        </form>
        <form action={toggle}>
          <Button
            type="submit"
            variant={disabled ? "primary" : "secondary"}
            size="sm"
          >
            {disabled ? "Re-enable access" : "Disable access"}
          </Button>
        </form>
      </div>
    </div>
  );
}
