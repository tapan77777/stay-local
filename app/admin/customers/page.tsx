import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/plan/auth";
import { listCustomers } from "@/lib/plan/customers";
import { formatDate } from "@/lib/plan/format";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = await listCustomers();
  return (
    <>
      <PageHeader
        title="Customers"
        description="Travelers who have (or will have) a StayLocal plan."
        action={
          <Link href="/admin/customers/new">
            <Button size="sm">New customer</Button>
          </Link>
        }
      />
      <div className="p-6">
        <div className="rounded-2xl border border-border bg-white">
          {customers.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              No customers yet.{" "}
              <Link
                href="/admin/customers/new"
                className="text-brand-green hover:underline"
              >
                Add the first one.
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">WhatsApp</th>
                    <th className="px-5 py-3 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium text-charcoal">
                        {c.name}
                      </td>
                      <td className="px-5 py-3 text-charcoal-soft">
                        {c.email}
                      </td>
                      <td className="px-5 py-3 text-charcoal-soft">
                        {c.whatsapp || "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">
                        {formatDate(c.createdAt)}
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
