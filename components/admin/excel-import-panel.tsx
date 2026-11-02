"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Change } from "@/lib/plan/excel/merge";
interface Preview {
  preview: string;
  operation: string;
  changes: Change[];
  warnings: string[];
  counts: Record<string, number>;
}
interface Revision {
  id: string;
  revision: number;
  created_at: string;
  actor: string;
  operation: string;
  summary: Record<string, number | string>;
}
const endpoint = "/admin/plans/excel";
const label = (change: Change) => {
  const row = change.after || change.before;
  return String(row?.name || row?.title || row?.day_label || row?.id || "");
};
export function ExcelImportPanel({
  planId,
  customers,
}: {
  planId?: string;
  customers: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState(""),
    [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [revisions, setRevisions] = useState<Revision[] | null>(null);
  const suffix = planId ? `&plan=${encodeURIComponent(planId)}` : "";
  async function request(mode: string, init: RequestInit = {}) {
    const response = await fetch(`${endpoint}?mode=${mode}${suffix}`, init);
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.errors?.join("\n") || data.error || "Request failed.",
      );
    return data;
  }
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setErrors([]);
    try {
      await task();
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : "Unable to complete the request.",
      ]);
    } finally {
      setBusy(false);
    }
  }
  function show(data: Preview) {
    setPreview(data);
    setSelected(data.changes.map((change) => change.key));
  }
  return (
    <div className="max-w-6xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-serif text-xl">
          {planId ? "Export and update this plan" : "Import a new plan"}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-brand-green-dark">
          <a className="underline" href={`${endpoint}?mode=template`}>
            Download Blank Template
          </a>
          {planId ? (
            <a className="underline" href={`${endpoint}?mode=export${suffix}`}>
              Export Excel
            </a>
          ) : (
            <Link className="underline" href="/admin/plans">
              Choose an existing plan to export or update
            </Link>
          )}
        </div>
        <p className="text-sm text-muted">
          Fill the Instructions and supported worksheets using plain values.
          Rows marked EXAMPLE are ignored. Blank cells preserve existing data;
          use [CLEAR] for an optional field or DELETE to remove a record
          explicitly. Upload limit: 3 MiB.
        </p>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPreview(null);
            void run(async () => {
              if (!file) throw new Error("Choose an .xlsx workbook.");
              if (file.size > 3 * 1024 * 1024)
                throw new Error("Upload limit is 3 MiB.");
              show(
                await request(
                  `preview${planId ? "" : `&customer=${encodeURIComponent(customer)}`}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      "X-File-Name": encodeURIComponent(file.name),
                    },
                    body: file,
                  },
                ),
              );
            });
          }}
        >
          {!planId && (
            <label className="block text-sm font-medium">
              Customer
              <select
                required
                disabled={busy}
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  setPreview(null);
                }}
                className="mt-1 block w-full rounded-md border border-border p-2"
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.email}
                  </option>
                ))}
              </select>
              {!customers.length && (
                <Link href="/admin/customers/new" className="underline">
                  Create a customer first
                </Link>
              )}
            </label>
          )}
          <label className="block text-sm font-medium">
            Excel workbook
            <input
              required
              disabled={busy}
              type="file"
              accept=".xlsx"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setPreview(null);
                setErrors([]);
              }}
              className="mt-2 block w-full rounded-md border border-border p-2"
            />
          </label>
          <Button
            disabled={busy || !file || (!planId && !customer)}
            type="submit"
          >
            {busy ? "Working…" : "Validate and preview"}
          </Button>
        </form>
      </section>
      <div role="status" aria-live="polite">
        {busy && <p className="text-sm">Processing your request…</p>}
      </div>
      {errors.length > 0 && (
        <div
          role="alert"
          className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {errors.join("\n")}
        </div>
      )}
      {preview && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="font-serif text-xl">
            {preview.operation === "IMPORT"
              ? "Import preview · new draft"
              : preview.operation === "RESTORE"
                ? "Revision restore preview"
                : "Update preview"}
          </h2>
          <p className="text-sm">
            {preview.counts.destinations || 0} destinations ·{" "}
            {preview.counts.itinerary_days || 0} itinerary days ·{" "}
            {Object.values(preview.counts).reduce(
              (sum, count) => sum + count,
              0,
            )}{" "}
            records across{" "}
            {Object.values(preview.counts).filter(Boolean).length} valid
            sections
          </p>
          <p className="text-sm">
            {preview.changes.filter((c) => c.kind === "add").length} added ·{" "}
            {preview.changes.filter((c) => c.kind === "modify").length} modified
            · {preview.changes.filter((c) => c.kind === "delete").length}{" "}
            explicitly removed
          </p>
          {preview.warnings.map((w) => (
            <p key={w} className="text-sm text-amber-800">
              {w}
            </p>
          ))}
          <p className="text-sm text-muted">
            Review every selected record, including deletions. Unselected
            changes are rejected. Related records must be selected together.
            Status and access settings stay under Plan Builder control.
          </p>
          <div className="max-h-[34rem] space-y-3 overflow-y-auto">
            {preview.changes.map((change) => (
              <div
                key={change.key}
                className="rounded-lg border border-border p-3"
              >
                <label className="flex items-start gap-3 text-sm font-medium">
                  <input
                    disabled={busy}
                    type="checkbox"
                    checked={selected.includes(change.key)}
                    onChange={(e) =>
                      setSelected((keys) =>
                        e.target.checked
                          ? [...keys, change.key]
                          : keys.filter((key) => key !== change.key),
                      )
                    }
                  />
                  <span>
                    {change.kind.toUpperCase()} · {change.sheet} ·{" "}
                    {label(change)}
                  </span>
                </label>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer">
                    Inspect {change.fields.length} field changes
                  </summary>
                  <div className="overflow-x-auto">
                    <table className="mt-2 w-full text-left">
                      <thead>
                        <tr>
                          <th className="p-2">Field</th>
                          <th className="p-2">Existing</th>
                          <th className="p-2">New</th>
                        </tr>
                      </thead>
                      <tbody>
                        {change.fields.map((field) => (
                          <tr
                            key={field.field}
                            className="border-t border-border"
                          >
                            <th className="p-2 font-normal">{field.field}</th>
                            <td className="max-w-sm whitespace-pre-wrap break-words p-2">
                              {String(field.before ?? "—")}
                            </td>
                            <td className="max-w-sm whitespace-pre-wrap break-words p-2">
                              {String(field.after ?? "—")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={busy || !selected.length}
              onClick={() =>
                void run(async () => {
                  const data = await request("confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      preview: preview.preview,
                      selected,
                    }),
                  });
                  router.push(`/admin/plans/${data.planId}?excel=saved`);
                  router.refresh();
                })
              }
            >
              {busy
                ? "Saving…"
                : preview.operation === "IMPORT"
                  ? "Confirm selected changes · create draft"
                  : "Confirm selected changes"}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setPreview(null)}
            >
              Cancel preview
            </Button>
          </div>
        </section>
      )}
      {planId && (
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="font-serif text-xl">Excel revision history</h2>
          <p className="text-sm text-muted">
            Inspect a saved revision against the current plan, then confirm
            selected changes to restore it. A baseline preserves the content
            before each Excel update. The current shared administrator account
            is recorded as “admin”.
          </p>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void run(async () =>
                setRevisions((await request("history")).revisions),
              )
            }
          >
            Load revision history
          </Button>
          {revisions && (
            <ul className="space-y-3">
              {!revisions.length && (
                <li className="text-sm">No Excel revisions yet.</li>
              )}
              {revisions.map((revision) => (
                <li
                  key={revision.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm"
                >
                  <span>
                    Revision {revision.revision} · {revision.operation} ·{" "}
                    {new Date(revision.created_at).toLocaleString()} ·{" "}
                    {revision.actor}
                    <span className="block text-muted">
                      {Object.entries(revision.summary)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </span>
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void run(async () =>
                        show(
                          await request("restore", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ revision: revision.id }),
                          }),
                        ),
                      )
                    }
                  >
                    Inspect / restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <Link
        href={planId ? `/admin/plans/${planId}` : "/admin/plans"}
        className="inline-block text-sm text-brand-green-dark underline"
      >
        Back to {planId ? "Plan Builder" : "plans"}
      </Link>
    </div>
  );
}
