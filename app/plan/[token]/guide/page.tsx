import { PlanPlaceholder } from "@/components/plan/plan-placeholder";
import { PlanShell } from "@/components/plan/plan-shell";
import { authenticatePlan } from "@/lib/plan/customer-view";

export default async function PlanGuidePage({
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
        eyebrow="India guide"
        title="Everything to know before you fly."
        description="Documents, SIM cards, money, cultural etiquette, scams to watch for, packing — the things that don't belong to a single destination. I'm putting these together for your trip now."
        whatsappContact={plan.whatsappContact}
        tripTitle={plan.title}
      />
    </PlanShell>
  );
}
