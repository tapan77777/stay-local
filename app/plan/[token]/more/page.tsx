import { PlanShell } from "@/components/plan/plan-shell";
import { MoreOverview } from "@/components/plan/more-overview";
import { authenticatePlan, loadPlanOverview } from "@/lib/plan/customer-view";
import { listPlanDocuments } from "@/lib/plan/documents";

export default async function PlanMorePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const [documents, overview] = await Promise.all([
    listPlanDocuments(plan.id),
    loadPlanOverview(plan.id),
  ]);

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <MoreOverview
        token={token}
        plan={plan}
        documents={documents}
        totalNights={overview.totalNights}
      />
    </PlanShell>
  );
}
