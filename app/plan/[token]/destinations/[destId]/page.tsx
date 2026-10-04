import { notFound } from "next/navigation";
import { DestinationHub } from "@/components/plan/destination-hub";
import { PlanShell } from "@/components/plan/plan-shell";
import {
  authenticatePlan,
  loadPlanOverview,
} from "@/lib/plan/customer-view";

export default async function DestinationHubPage({
  params,
}: {
  params: Promise<{ token: string; destId: string }>;
}) {
  const { token, destId } = await params;
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const overview = await loadPlanOverview(plan.id);

  // The traveler can only reach destinations that belong to this plan. We do
  // a client-side lookup over the already-fetched list (no extra query) so a
  // tampered destId from a different plan simply 404s rather than leaking.
  const idx = overview.destinations.findIndex(
    (d) => d.destination.id === destId
  );
  if (idx === -1) notFound();
  const current = overview.destinations[idx];
  const prev = idx > 0 ? overview.destinations[idx - 1].destination : null;
  const next =
    idx < overview.destinations.length - 1
      ? overview.destinations[idx + 1].destination
      : null;

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <DestinationHub
        token={token}
        destination={current.destination}
        counts={current.counts}
        whatsappContact={plan.whatsappContact}
        tripTitle={plan.title}
        prev={prev ? { id: prev.id, name: prev.name } : null}
        next={next ? { id: next.id, name: next.name } : null}
        index={idx + 1}
        totalDestinations={overview.destinations.length}
      />
    </PlanShell>
  );
}
