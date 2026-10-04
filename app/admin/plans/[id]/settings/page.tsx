import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PlanForm } from "@/components/admin/plan-form";
import { PlanStatusBadge } from "@/components/admin/plan-status-badge";
import { formatDate } from "@/lib/plan/format";
import { requireAdmin } from "@/lib/plan/auth";
import { listCustomers } from "@/lib/plan/customers";
import { evaluatePlanAccess, getPlan } from "@/lib/plan/plans";

export default async function AdminPlanSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [plan, customers] = await Promise.all([
    getPlan(id),
    listCustomers(),
  ]);
  if (!plan) notFound();

  const access = evaluatePlanAccess(plan);

  return (
    <>
      <PageHeader
        title={`${plan.title || "Untitled plan"} — settings`}
        description="Core trip metadata, status, and access window."
        action={
          <div className="flex items-center gap-3">
            <PlanStatusBadge status={plan.status} />
            <Link
              href={`/admin/plans/${plan.id}`}
              className="text-sm text-muted hover:underline"
            >
              Back to builder
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-white p-6">
            <h2 className="mb-5 font-serif text-lg text-charcoal">
              Plan details
            </h2>
            <PlanForm mode="edit" customers={customers} plan={plan} />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
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
            <dl className="mt-4 space-y-2 text-xs text-muted">
              <div className="flex justify-between">
                <dt>Created</dt>
                <dd>{formatDate(plan.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Updated</dt>
                <dd>{formatDate(plan.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}
