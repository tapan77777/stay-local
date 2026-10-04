import { PlanPlaceholder } from "@/components/plan/plan-placeholder";
import { PlanShell } from "@/components/plan/plan-shell";
import { PlanMap } from "@/components/plan/plan-map";
import { authenticatePlan } from "@/lib/plan/customer-view";
import { loadPlanMapData } from "@/lib/plan/map-data";

/*
 * Customer map page.
 *
 * The map renders only when the plan has at least one geocoded pin. The pin
 * data lives in `map_pins` — the one Phase 2A table that carries real
 * latitude/longitude — so empty plans short-circuit to the placeholder rather
 * than ship a blank map tile.
 */

export default async function PlanMapPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const data = await loadPlanMapData(plan.id);

  if (data.pins.length === 0) {
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
          title="Your map is coming together."
          description="Places will appear here as locations are added to your plan. For now, each stop keeps its places inside the destination screen."
          whatsappContact={plan.whatsappContact}
          tripTitle={plan.title}
        />
      </PlanShell>
    );
  }

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <PlanMap token={token} pins={data.pins} destinations={data.destinations} />
    </PlanShell>
  );
}
