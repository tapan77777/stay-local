import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { DestinationForm } from "@/components/admin/plan-builder/destination-form";
import { SectionCard } from "@/components/admin/plan-builder/section-card";
import { requireAdmin } from "@/lib/plan/auth";
import {
  getDestination,
  getDestinationModuleCounts,
} from "@/lib/plan/destinations";
import { formatDateRange } from "@/lib/plan/format";
import { getPlan } from "@/lib/plan/plans";
import { MODULE_KEYS, MODULE_LABEL, type ModuleKey } from "@/lib/plan/types";

export default async function AdminDestinationPage({
  params,
}: {
  params: Promise<{ id: string; destId: string }>;
}) {
  await requireAdmin();
  const { id, destId } = await params;
  const [plan, destination, counts] = await Promise.all([
    getPlan(id),
    getDestination(destId),
    getDestinationModuleCounts(destId),
  ]);
  if (!plan || !destination || destination.planId !== id) notFound();

  const dateRange =
    destination.arrivalDate || destination.departureDate
      ? formatDateRange(destination.arrivalDate, destination.departureDate)
      : null;

  return (
    <>
      <PageHeader
        title={destination.name || "Untitled destination"}
        description={
          [
            destination.nights != null
              ? `${destination.nights} night${destination.nights === 1 ? "" : "s"}`
              : null,
            dateRange,
          ]
            .filter(Boolean)
            .join(" · ") || "No dates set"
        }
        action={
          <Link
            href={`/admin/plans/${id}`}
            className="text-sm text-muted hover:underline"
          >
            Back to plan
          </Link>
        }
      />

      <div className="space-y-6 p-6">
        <nav className="flex flex-wrap gap-2">
          {(MODULE_KEYS as readonly ModuleKey[]).map((k) => {
            const n = counts[k];
            return (
              <Link
                key={k}
                href={`/admin/plans/${id}/destinations/${destId}/${k}`}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-charcoal hover:bg-charcoal/[0.04]"
              >
                {MODULE_LABEL[k]}
                {n > 0 ? (
                  <span className="ml-1.5 text-muted">· {n}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <SectionCard
          title="Destination details"
          description="Core info the traveler sees first when opening this stop."
        >
          <DestinationForm
            planId={id}
            mode="edit"
            destination={destination}
          />
        </SectionCard>
      </div>
    </>
  );
}
