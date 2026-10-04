import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { PlanForm } from "@/components/admin/plan-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/plan/auth";
import { listCustomers } from "@/lib/plan/customers";

export default async function NewPlanPage() {
  await requireAdmin();
  const customers = await listCustomers();

  if (customers.length === 0) {
    return (
      <>
        <PageHeader
          title="New plan"
          description="Create a plan for an existing customer."
          action={
            <Link
              href="/admin/plans"
              className="text-sm text-muted hover:underline"
            >
              Cancel
            </Link>
          }
        />
        <div className="p-6">
          <div className="max-w-xl rounded-2xl border border-border bg-white p-6 text-sm">
            <p className="text-charcoal-soft">
              You need to add a customer before you can create a plan.
            </p>
            <div className="mt-4">
              <Link href="/admin/customers/new">
                <Button size="sm">Add customer</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="New plan"
        description="Set up the trip, dates, and access window."
        action={
          <Link
            href="/admin/plans"
            className="text-sm text-muted hover:underline"
          >
            Cancel
          </Link>
        }
      />
      <div className="p-6">
        <div className="max-w-2xl rounded-2xl border border-border bg-white p-6">
          <PlanForm mode="create" customers={customers} />
        </div>
      </div>
    </>
  );
}
