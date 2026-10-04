import { JourneyTimeline } from "@/components/plan/journey-timeline";
import { PlanShell } from "@/components/plan/plan-shell";
import {
  authenticatePlan,
  loadPlanOverview,
} from "@/lib/plan/customer-view";

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const overview = await loadPlanOverview(plan.id);

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <JourneyTimeline
        token={token}
        tripTitle={plan.title}
        destinations={overview.destinations}
      />
    </PlanShell>
  );
}
