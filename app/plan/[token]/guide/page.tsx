import { PlanPlaceholder } from "@/components/plan/plan-placeholder";
import { PlanShell } from "@/components/plan/plan-shell";
import { IndiaGuideList } from "@/components/plan/india-guide-list";
import { authenticatePlan } from "@/lib/plan/customer-view";
import { listIndiaGuideItems } from "@/lib/plan/india-guide";

export default async function PlanGuidePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const items = await listIndiaGuideItems(plan.id);

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      {items.length === 0 ? (
        <PlanPlaceholder
          token={token}
          eyebrow="India guide"
          title="Everything to know before you fly."
          description="Documents, SIM cards, money, cultural etiquette, scams to watch for, packing — the things that don't belong to a single destination. I'm putting these together for your trip now."
          whatsappContact={plan.whatsappContact}
          tripTitle={plan.title}
        />
      ) : (
        <IndiaGuideList
          token={token}
          items={items}
          whatsappContact={plan.whatsappContact}
          tripTitle={plan.title}
        />
      )}
    </PlanShell>
  );
}
