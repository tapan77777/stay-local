import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { PlanStatusBadge } from "@/components/admin/plan-status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/plan/auth";
import { getDashboardStats, listPlans } from "@/lib/plan/plans";
import { formatDateRange } from "@/lib/plan/format";

export default async function AdminDashboardPage() {
  await requireAdmin();

  // Two queries in parallel: one aggregate stats query + the recent plans
  // list (bounded to 10). No N+1 — plans + customers come back in a single
  // JOIN inside listPlans().
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    listPlans({ limit: 10 }),
  ]);
  const { customers, plans: planStats } = stats;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="StayLocal Plan — internal control panel"
        action={
          <Link href="/admin/plans/new">
            <Button size="sm">New plan</Button>
          </Link>
        }
      />
      <div className="space-y-8 p-6">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Customers" value={customers} />
          <StatCard label="Total plans" value={planStats.total} />
          <StatCard label="Draft" value={planStats.byStatus.DRAFT} />
          <StatCard label="Active" value={planStats.byStatus.ACTIVE} />
          <StatCard label="Completed" value={planStats.byStatus.COMPLETED} />
          <StatCard label="Disabled" value={planStats.byStatus.DISABLED} />
        </section>

        <section className="rounded-2xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg text-charcoal">Recent plans</h2>
            <Link
              href="/admin/plans"
              className="text-xs text-brand-green hover:underline"
            >
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No plans yet.{" "}
              <Link
                href="/admin/plans/new"
                className="text-brand-green hover:underline"
              >
                Create the first one.
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
                  {recent.map((p) => (
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
        </section>
      </div>
    </>
  );
}
