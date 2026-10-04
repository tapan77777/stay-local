import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { CustomerForm } from "@/components/admin/customer-form";
import { requireAdmin } from "@/lib/plan/auth";

export default async function NewCustomerPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="New customer"
        description="Create the traveler record before assigning them a plan."
        action={
          <Link
            href="/admin/customers"
            className="text-sm text-muted hover:underline"
          >
            Cancel
          </Link>
        }
      />
      <div className="p-6">
        <div className="max-w-xl rounded-2xl border border-border bg-white p-6">
          <CustomerForm />
        </div>
      </div>
    </>
  );
}
