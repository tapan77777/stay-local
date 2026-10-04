import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PlanAccessPanel } from "@/components/admin/plan-access-panel";
import { PlanStatusBadge } from "@/components/admin/plan-status-badge";
import { DocumentsSection } from "@/components/admin/plan-builder/documents-section";
import { HelpForm } from "@/components/admin/plan-builder/help-form";
import { IndiaGuideSection } from "@/components/admin/plan-builder/india-guide-section";
import { JourneySection } from "@/components/admin/plan-builder/journey-section";
import { OverviewForm } from "@/components/admin/plan-builder/overview-form";
import { SectionCard } from "@/components/admin/plan-builder/section-card";
import { requireAdmin } from "@/lib/plan/auth";
import {
  listDestinationModuleCounts,
  listDestinations,
} from "@/lib/plan/destinations";
import { listPlanDocuments } from "@/lib/plan/documents";
import { listIndiaGuideItems } from "@/lib/plan/india-guide";
import {
  evaluatePlanAccess,
  getPlan,
} from "@/lib/plan/plans";
import type { DestinationModuleCounts } from "@/lib/plan/types";

export default async function AdminPlanBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  // Parallel fetches — no sequential waterfall.
  const [plan, destinations, guideItems, documents] = await Promise.all([
    getPlan(id),
    listDestinations(id),
    listIndiaGuideItems(id),
    listPlanDocuments(id),
  ]);
  if (!plan) notFound();

  const countsMap = await listDestinationModuleCounts(id);
  const counts: Record<string, DestinationModuleCounts> = {};
  for (const [k, v] of countsMap) counts[k] = v;

  const access = evaluatePlanAccess(plan);

  return (
    <>
      <PageHeader
        title={plan.title || "Untitled plan"}
        description={
          plan.customer
            ? `For ${plan.customer.name} • ${plan.customer.email}`
            : "No customer linked"
        }
        action={
          <div className="flex items-center gap-3">
            <PlanStatusBadge status={plan.status} />
            <Link
              href={`/admin/plans/${plan.id}/preview`}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-charcoal hover:bg-charcoal/[0.04]"
            >
              Preview
            </Link>
            <Link
              href={`/admin/plans/${plan.id}/settings`}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-charcoal hover:bg-charcoal/[0.04]"
            >
              Settings
            </Link>
            <Link
              href="/admin/plans"
              className="text-sm text-muted hover:underline"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <SectionCard
            title="Overview"
            description="How you'd summarise this trip to the traveler."
          >
            <OverviewForm plan={plan} />
          </SectionCard>

          <JourneySection
            planId={plan.id}
            destinations={destinations}
            counts={counts}
          />

          <IndiaGuideSection planId={plan.id} items={guideItems} />

          <DocumentsSection planId={plan.id} documents={documents} />

          <SectionCard
            title="Help"
            description="How travelers reach you if something goes wrong."
          >
            <HelpForm plan={plan} />
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <PlanAccessPanel plan={plan} />
          <div className="rounded-2xl border border-border bg-white p-6 text-sm">
            <h2 className="mb-3 font-serif text-lg text-charcoal">
              Access state
            </h2>
            {access.ok ? (
              <p className="text-brand-green-dark">
                Customer can access this plan right now.
              </p>
            ) : (
              <p className="text-terracotta">
                Currently blocked
                {access.reason === "disabled"
                  ? " — plan is disabled."
                  : access.reason === "not_yet"
                    ? " — access hasn't started yet."
                    : access.reason === "expired"
                      ? " — access window has ended."
                      : "."}
              </p>
            )}
            <div className="mt-4 border-t border-border pt-4 text-xs text-muted">
              <p>
                Core trip settings — status, dates, access window — live in{" "}
                <Link
                  href={`/admin/plans/${plan.id}/settings`}
                  className="text-brand-green hover:underline"
                >
                  Settings
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
