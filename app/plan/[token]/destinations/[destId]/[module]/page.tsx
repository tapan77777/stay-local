import { notFound } from "next/navigation";
import { PlanPlaceholder } from "@/components/plan/plan-placeholder";
import { PlanShell } from "@/components/plan/plan-shell";
import {
  authenticatePlan,
  loadPlanOverview,
} from "@/lib/plan/customer-view";
import { MODULE_KEYS, MODULE_LABEL, type ModuleKey } from "@/lib/plan/types";

/*
 * Per-destination module placeholder (Phase 3C work).
 *
 * Lives at /plan/[token]/destinations/[destId]/[module] so the Destination Hub
 * tiles have a valid landing until each module (places/food/transport/…) gets
 * its own screen in a later phase. The destination lookup still runs here so
 * tampered destIds and unknown module keys 404 cleanly instead of flashing a
 * generic "coming soon".
 */

function isModuleKey(v: string): v is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(v);
}

export default async function DestinationModulePage({
  params,
}: {
  params: Promise<{ token: string; destId: string; module: string }>;
}) {
  const { token, destId, module } = await params;
  if (!isModuleKey(module)) notFound();
  const auth = await authenticatePlan(token);
  if (!auth.ok) return auth.render;

  const { plan, session } = auth;
  const overview = await loadPlanOverview(plan.id);
  const current = overview.destinations.find((d) => d.destination.id === destId);
  if (!current) notFound();

  return (
    <PlanShell
      token={token}
      tripTitle={plan.title}
      travelerDisplayName={plan.customer?.name || session.name}
      whatsappContact={plan.whatsappContact}
    >
      <PlanPlaceholder
        token={token}
        eyebrow={`${current.destination.name} · ${MODULE_LABEL[module]}`}
        title={`${MODULE_LABEL[module]} is being written for you.`}
        description={`I'm putting together ${MODULE_LABEL[module].toLowerCase()} for ${current.destination.name}. This screen gets its full editorial layout in the next release — until then, WhatsApp me if you'd like a preview.`}
        whatsappContact={plan.whatsappContact}
        tripTitle={plan.title}
      />
    </PlanShell>
  );
}
