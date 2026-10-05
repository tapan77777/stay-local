import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { PlanStatusBadge } from "@/components/admin/plan-status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/plan/auth";
import { countActiveDevicesByPlan } from "@/lib/plan/devices";
import { listPlans } from "@/lib/plan/plans";
import { formatDateRange } from "@/lib/plan/format";

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await listPlans();
  // One grouped query across every plan on the page — avoids N+1.
  const activeByPlan = await countActiveDevicesByPlan(plans.map((p) => p.id));
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
                    <th className="px-5 py-3 font-medium">Devices</th>
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
                        <DevicesCell
                          active={activeByPlan.get(p.id) ?? 0}
                          max={p.maxDevices}
                        />
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

// Three colour states, matching the detail panel chip:
//   • green  — under limit, with headroom
//   • cream  — at the cap, nothing wrong, just full
//   • terracotta — over the cap (admin lowered maxDevices after use)
function DevicesCell({ active, max }: { active: number; max: number }) {
  const over = active > max;
  const full = active >= max && !over;
  const cls = over
    ? "bg-terracotta/10 text-terracotta"
    : full
      ? "bg-cream-warm text-charcoal-soft"
      : "bg-brand-green/10 text-brand-green-dark";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium " +
        cls
      }
    >
      {active} / {max}
    </span>
  );
}
