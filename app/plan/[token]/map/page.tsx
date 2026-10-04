import { PlanPlaceholder } from "@/components/plan/plan-placeholder";
import { PlanShell } from "@/components/plan/plan-shell";
import { authenticatePlan } from "@/lib/plan/customer-view";

export default async function PlanMapPage({
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
        eyebrow="Map"
        title="Your map is coming soon."
        description="Every place I've picked for you — restaurants, viewpoints, stays, and short walks — will land here on a single map. For now, each stop keeps its places inside the destination screen."
        whatsappContact={plan.whatsappContact}
        tripTitle={plan.title}
      />
    </PlanShell>
  );
}
