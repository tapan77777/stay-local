import { notFound } from "next/navigation";
import { PlanShell } from "@/components/plan/plan-shell";
import { IndiaGuideDetail } from "@/components/plan/india-guide-detail";
import { authenticatePlan } from "@/lib/plan/customer-view";
import { getIndiaGuideItem } from "@/lib/plan/india-guide";

export default async function PlanGuideItemPage({
  params,
}: {
  params: Promise<{ token: string; itemId: string }>;
}) {
  const { token, itemId } = await params;
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const item = await getIndiaGuideItem(itemId);
  // 404 if the item is missing or belongs to a different plan — never let a
  // traveler see another plan's content via a guessed URL.
  if (!item || item.planId !== plan.id) notFound();

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <IndiaGuideDetail
        token={token}
        item={item}
        whatsappContact={plan.whatsappContact}
        tripTitle={plan.title}
      />
    </PlanShell>
  );
}
