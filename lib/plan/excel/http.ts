import { randomUUID, createHash } from "node:crypto";
import { makeWorkbook, parseWorkbook, WorkbookError } from "./workbook";
import { MAX_BYTES, VERSION } from "./schema";
import { emptySnapshot, mergeWorkbook } from "./merge";
import {
  confirmPreview,
  getPreview,
  listRevisions,
  readState,
  restorePreview,
  savePreview,
  type Database,
} from "./store";
export const uuid = (value: string | null): value is string =>
  !!value &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function limitedBody(request: Request, max: number): Promise<Buffer> {
  if (Number(request.headers.get("content-length")) > max)
    throw new WorkbookError("Upload exceeds the size limit.");
  const reader = request.body?.getReader();
  if (!reader) throw new WorkbookError("Choose an .xlsx workbook.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    bytes += next.value.length;
    if (bytes > max) {
      await reader.cancel();
      throw new WorkbookError("Upload exceeds the size limit.");
    }
    chunks.push(next.value);
  }
  return Buffer.concat(chunks);
}
export function sameOrigin(request: Request): boolean {
  try {
    const origin = request.headers.get("origin");
    if (!origin) return false;
    const source = new URL(origin);
    const target = new URL(request.url);
    // Next reconstructs request.url using its bind hostname. The actual HTTP
    // Host is the browser-facing origin, including on localhost/proxy hosts.
    const host = request.headers.get("host") || target.host;
    return (
      ["http:", "https:"].includes(source.protocol) &&
      source.host.toLowerCase() === host.toLowerCase()
    );
  } catch {
    return false;
  }
}
export async function handleExcelRequest(
  request: Request,
  db: Database,
  authenticate: () => Promise<boolean>,
): Promise<Response> {
  if (!(await authenticate()))
    return json({ error: "Administrator sign-in required." }, 401);
  const url = new URL(request.url),
    mode = url.searchParams.get("mode") || "template",
    planId = url.searchParams.get("plan");
  if (planId && !uuid(planId))
    return json({ error: "Invalid plan reference." }, 400);
  try {
    if (request.method === "GET") {
      if (mode === "history" && planId)
        return json({ revisions: await listRevisions(db, planId) });
      const state =
        mode === "export" && planId ? await readState(db, planId) : null;
      if (!state && mode !== "template")
        return json({ error: "Choose a plan to export." }, 400);
      const buffer = await makeWorkbook(
        state?.snapshot,
        state
          ? {
              template_version: VERSION,
              export_scope: state.scope,
              content_version: state.version,
            }
          : {},
        !state,
      );
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="staylocal-${state ? "plan" : "template"}.xlsx"`,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (request.method !== "POST")
      return json({ error: "Method not allowed." }, 405);
    if (!sameOrigin(request))
      return json(
        { error: "This request must come from the StayLocal admin interface." },
        403,
      );
    if (mode === "confirm" || mode === "restore") {
      const data = JSON.parse(
        (await limitedBody(request, 256 * 1024)).toString(),
      );
      if (mode === "restore") {
        if (!planId || !uuid(data.revision))
          return json({ error: "Choose a revision." }, 400);
        const id = await restorePreview(db, planId, data.revision);
        const preview = await getPreview(db, id);
        return json({
          preview: id,
          changes: preview.changes,
          operation: "RESTORE",
          warnings: [],
          counts: Object.fromEntries(
            Object.entries(preview.after_snapshot).map(([key, rows]) => [
              key,
              rows.length,
            ]),
          ),
        });
      }
      if (
        !uuid(data.preview) ||
        !Array.isArray(data.selected) ||
        data.selected.length > 2000 ||
        data.selected.some(
          (v: unknown) => typeof v !== "string" || v.length > 100,
        )
      )
        return json({ error: "Invalid confirmation." }, 400);
      try {
        return json({
          planId: await confirmPreview(db, data.preview, data.selected),
        });
      } catch (error) {
        return json(
          { error: error instanceof Error ? error.message : "Unable to save." },
          409,
        );
      }
    }
    if (mode !== "preview")
      return json({ error: "Unsupported operation." }, 400);
    if (!/\.xlsx$/i.test(request.headers.get("x-file-name") ?? ""))
      return json({ error: "Choose an .xlsx file." }, 400);
    const buffer = await limitedBody(request, MAX_BYTES);
    const parsed = await parseWorkbook(buffer);
    let before = emptySnapshot(),
      version: string | null = null;
    const targetId = planId || randomUUID();
    const customerId = url.searchParams.get("customer");
    if (planId) {
      const state = await readState(db, planId);
      if (parsed.metadata.export_scope !== planId)
        return json(
          {
            error:
              "This workbook was not exported from the selected plan. Export this plan and edit that workbook.",
          },
          409,
        );
      if (parsed.metadata.content_version !== state.version)
        return json(
          {
            error:
              "This export is stale. Export a fresh workbook before updating.",
          },
          409,
        );
      before = state.snapshot;
      version = state.version;
    } else {
      if (parsed.metadata.export_scope || parsed.metadata.content_version)
        return json(
          {
            error:
              "Use a blank template to create a new plan. Exported workbooks update their original plan.",
          },
          400,
        );
      if (!uuid(customerId))
        return json(
          { error: "Select an existing customer for this plan." },
          400,
        );
      if (
        !(await db.query("SELECT id FROM customers WHERE id=$1", [customerId]))
          .length
      )
        return json({ error: "Selected customer no longer exists." }, 400);
    }
    const result = mergeWorkbook(parsed, before, targetId);
    if (result.errors.length)
      return json({ errors: result.errors, warnings: result.warnings }, 422);
    if (!result.changes.length)
      return json(
        { error: "No changes found. Edit the workbook and upload again." },
        400,
      );
    const id = await savePreview(
      db,
      {
        plan_id: targetId,
        customer_id: planId ? null : customerId,
        operation: planId ? "UPDATE" : "IMPORT",
        expected_version: version,
        before_snapshot: before,
        after_snapshot: result.snapshot,
        changes: result.changes,
      },
      planId
        ? null
        : createHash("sha256").update(customerId!).update(buffer).digest("hex"),
    );
    const stored = await getPreview(db, id);
    if (stored.completed_at)
      return json(
        {
          error:
            "This workbook has already been imported for this customer. Open the existing plan or use a new template for a different trip.",
          existingPlanId: stored.plan_id,
        },
        409,
      );
    return json({
      preview: id,
      operation: planId ? "UPDATE" : "IMPORT",
      changes: stored.changes,
      warnings: result.warnings,
      counts: Object.fromEntries(
        Object.entries(stored.after_snapshot).map(([key, rows]) => [
          key,
          rows.length,
        ]),
      ),
    });
  } catch (error) {
    if (error instanceof WorkbookError)
      return json({ error: error.message }, 400);
    if (error instanceof SyntaxError)
      return json({ error: "Invalid request data." }, 400);
    // Never send database errors (which may contain SQL parameters/customer content) to logs or clients.
    return json(
      {
        error:
          "Unable to complete this operation. Verify the Excel database migration has been applied, then retry.",
      },
      500,
    );
  }
}
