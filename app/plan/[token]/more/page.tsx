import { PlanPlaceholder } from "@/components/plan/plan-placeholder";
import { PlanShell } from "@/components/plan/plan-shell";
import { authenticatePlan } from "@/lib/plan/customer-view";

export default async function PlanMorePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <PlanPlaceholder
        token={token}
        eyebrow="More"
        title="Everything else lives here."
        description="Documents, trip settings, and the quickest way to reach Tapan. The dedicated screens for each are landing soon — in the meantime WhatsApp is the fastest way to get me."
        whatsappContact={plan.whatsappContact}
        tripTitle={plan.title}
      />
    </PlanShell>
  );
}
