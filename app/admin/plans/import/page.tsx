import { PageHeader } from "@/components/admin/page-header";
import { ExcelImportPanel } from "@/components/admin/excel-import-panel";
import { requireAdmin } from "@/lib/plan/auth";
import { listCustomers } from "@/lib/plan/customers";
import { getPlan } from "@/lib/plan/plans";
import { uuid } from "@/lib/plan/excel/http";
import { notFound } from "next/navigation";
export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  await requireAdmin();
  const { plan: id } = await searchParams;
  if (id && !uuid(id)) notFound();
  const plan = id ? await getPlan(id) : null;
  if (id && !plan) notFound();
  const customers = plan ? [] : await listCustomers();
  return (
    <>
      <PageHeader
        title={plan ? `Update from Excel · ${plan.title}` : "Import / Export"}
        description="Download, fill in, upload and review your workbook before saving."
      />
      <div className="p-4 md:p-6">
        <ExcelImportPanel
          planId={plan?.id}
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
          }))}
        />
      </div>
    </>
  );
}
