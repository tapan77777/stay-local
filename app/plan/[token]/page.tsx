import { PlanShell } from "@/components/plan/plan-shell";
import { TripHome } from "@/components/plan/trip-home";
import {
  authenticatePlan,
  loadPlanOverview,
} from "@/lib/plan/customer-view";

export default async function PlanPage({
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
      profilePhotoUrl={plan.profilePhotoUrl}
      whatsappContact={plan.whatsappContact}
    >
      <TripHome
        token={token}
        plan={plan}
        destinations={overview.destinations}
        totalNights={overview.totalNights}
      />
    </PlanShell>
  );
}
