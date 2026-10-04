import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { PlanStatusBadge } from "@/components/admin/plan-status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/plan/auth";
import { listPlans } from "@/lib/plan/plans";
import { formatDateRange } from "@/lib/plan/format";

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await listPlans();
  return (
    <>
      <PageHeader
        title="Plans"
        description="Every StayLocal Plan — drafts, active trips, archive."
        action={
          <Link href="/admin/plans/new">
            <Button size="sm">New plan</Button>
          </Link>
        }
      />
      <div className="p-6">
        <div className="rounded-2xl border border-border bg-white">
          {plans.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No plans yet.{" "}
              <Link
                href="/admin/plans/new"
                className="text-brand-green hover:underline"
              >
                Create one.
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-medium">Traveler</th>
                    <th className="px-5 py-3 font-medium">Trip</th>
                    <th className="px-5 py-3 font-medium">Dates</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Access</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-charcoal">
                          {p.customer?.name ?? "—"}
                        </div>
                        <div className="text-xs text-muted">
                          {p.customer?.email ?? ""}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-charcoal">
                          {p.title}
                        </div>
                        {p.subtitle ? (
                          <div className="text-xs text-muted">{p.subtitle}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-charcoal-soft">
                        {formatDateRange(p.startDate, p.endDate)}
                      </td>
                      <td className="px-5 py-3">
                        <PlanStatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {formatDateRange(p.accessStartsAt, p.accessEndsAt)}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/plans/${p.id}`}
                          className="text-xs text-brand-green hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
