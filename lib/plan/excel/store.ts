// Database adapter is injected so the exact production SQL can be tested in isolated Postgres.
import { randomUUID, randomBytes } from "node:crypto";
import { TABLES, fieldsFor, type Snapshot, type RecordData } from "./schema";
import { diffSnapshots, selectChanges, type Change } from "./merge";
export interface Statement {
  text: string;
  values: unknown[];
}
export interface Database {
  query(text: string, values?: unknown[]): Promise<Record<string, unknown>[]>;
  transaction(statements: Statement[]): Promise<unknown>;
}
export interface State {
  snapshot: Snapshot;
  version: string;
  scope: string;
}
export interface Preview {
  id: string;
  plan_id: string;
  customer_id: string | null;
  operation: "IMPORT" | "UPDATE" | "RESTORE";
  expected_version: string | null;
  before_snapshot: Snapshot;
  after_snapshot: Snapshot;
  changes: Change[];
  completed_at: unknown;
  expires_at: string;
}
const q = (text: string, values: unknown[] = []): Statement => ({
  text,
  values,
});
export function snapshotQuery(): string {
  const parts = TABLES.map((s) => {
    const cols = [
      "id",
      ...(s.parent ? [s.parent] : []),
      ...fieldsFor(s.table).map((f) => f.name),
    ];
    const projection = cols.map((c) => `'${c}',r.${c}`).join(",");
    const where =
      s.table === "plans"
        ? "r.id = p.id"
        : s.parent === "plan_id"
          ? "r.plan_id = p.id"
          : "r.destination_id IN (SELECT id FROM destinations WHERE plan_id = p.id)";
    return `'${s.table}',COALESCE((SELECT jsonb_agg(jsonb_build_object(${projection}) ORDER BY ${s.parent ? "r.position," : ""}r.id) FROM ${s.table} r WHERE ${where}),'[]'::jsonb)`;
  });
  return `SELECT p.content_version::text AS version,p.id::text AS scope,jsonb_build_object(${parts.join(",")}) AS snapshot FROM plans p WHERE p.id=$1`;
}
export async function readState(db: Database, planId: string): Promise<State> {
  const rows = await db.query(snapshotQuery(), [planId]);
  if (!rows[0]) throw new Error("Plan not found.");
  return rows[0] as unknown as State;
}
export async function savePreview(
  db: Database,
  data: Omit<Preview, "id" | "completed_at" | "expires_at">,
  fingerprint: string | null = null,
): Promise<string> {
  const id = randomUUID();
  // Remove expired unconfirmed uploads; completed receipts retain idempotency without workbook data.
  await db.query(
    "DELETE FROM plan_excel_previews WHERE expires_at < now() AND completed_at IS NULL",
  );
  const inserted = await db.query(
    `INSERT INTO plan_excel_previews(id,plan_id,customer_id,operation,expected_version,before_snapshot,after_snapshot,changes,import_fingerprint) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9) ON CONFLICT(import_fingerprint) DO NOTHING RETURNING id`,
    [
      id,
      data.plan_id,
      data.customer_id,
      data.operation,
      data.expected_version,
      JSON.stringify(data.before_snapshot),
      JSON.stringify(data.after_snapshot),
      JSON.stringify(data.changes),
      fingerprint,
    ],
  );
  if (inserted.length) return id;
  const existing = await db.query(
    "SELECT id FROM plan_excel_previews WHERE import_fingerprint=$1",
    [fingerprint],
  );
  if (!existing[0])
    throw new Error("Upload expired during validation. Retry the upload.");
  return String(existing[0].id);
}
export async function getPreview(db: Database, id: string): Promise<Preview> {
  const rows = await db.query("SELECT * FROM plan_excel_previews WHERE id=$1", [
    id,
  ]);
  if (!rows[0])
    throw new Error("Preview not found. Upload the workbook again.");
  return rows[0] as unknown as Preview;
}
export function contentStatements(
  before: Snapshot,
  after: Snapshot,
): Statement[] {
  const statements: Statement[] = [];
  const destinationDeletes: Statement[] = [];
  // Child deletions precede destination deletion, so no implicit cascade can discard unreviewed content.
  for (const section of [...TABLES].reverse())
    if (section.parent) {
      const kept = new Set(after[section.table].map((r) => r.id));
      for (const old of before[section.table])
        if (!kept.has(old.id))
          (section.table === "destinations"
            ? destinationDeletes
            : statements
          ).push(q(`DELETE FROM ${section.table} WHERE id=$1`, [old.id]));
    }
  for (const section of TABLES) {
    const existing = new Map(before[section.table].map((r) => [r.id, r]));
    for (const row of after[section.table]) {
      const old = existing.get(row.id);
      if (old && JSON.stringify(old) === JSON.stringify(row)) continue;
      const columns = [
        ...(section.parent ? [section.parent] : []),
        ...fieldsFor(section.table).map((f) => f.name),
      ];
      if (old || section.table === "plans")
        statements.push(
          q(
            `UPDATE ${section.table} SET ${columns.map((c, i) => `${c}=$${i + 2}`).join(",")},updated_at=now() WHERE id=$1`,
            [row.id, ...columns.map((c) => row[c] ?? null)],
          ),
        );
      else
        statements.push(
          q(
            `INSERT INTO ${section.table}(id,${columns.join(",")}) VALUES(${["id", ...columns].map((_, i) => `$${i + 1}`).join(",")})`,
            [row.id, ...columns.map((c) => row[c] ?? null)],
          ),
        );
    }
  }
  // Reparent surviving children before removing their old destination.
  return [...statements, ...destinationDeletes];
}
const summary = (changes: Change[]) => ({
  added: changes.filter((c) => c.kind === "add").length,
  modified: changes.filter((c) => c.kind === "modify").length,
  removed: changes.filter((c) => c.kind === "delete").length,
});
export async function confirmPreview(
  db: Database,
  id: string,
  selected: string[],
): Promise<string> {
  const preview = await getPreview(db, id);
  if (preview.completed_at) return preview.plan_id;
  if (new Date(preview.expires_at).getTime() <= Date.now())
    throw new Error("Preview expired. Upload the workbook again.");
  if (!selected.length) throw new Error("Select at least one change.");
  const after = selectChanges(
    preview.before_snapshot,
    preview.changes,
    selected,
  );
  const changes = diffSnapshots(preview.before_snapshot, after);
  const statements = [q("SELECT sl_excel_guard($1)", [id])];
  if (preview.operation === "IMPORT")
    statements.push(
      q(
        `INSERT INTO plans(id,customer_id,private_token,status) VALUES($1,$2,$3,'DRAFT')`,
        [
          preview.plan_id,
          preview.customer_id,
          randomBytes(24).toString("base64url"),
        ],
      ),
    );
  // Capture the immediate pre-operation state too, including manual edits since the last Excel revision.
  if (preview.operation !== "IMPORT")
    statements.push(
      q(
        `INSERT INTO plan_excel_revisions(plan_id,revision,actor,operation,summary,snapshot) SELECT $1,COALESCE(MAX(revision),0)+1,'admin','BASELINE','{"reason":"Before Excel operation"}'::jsonb,$2::jsonb FROM plan_excel_revisions WHERE plan_id=$1`,
        [preview.plan_id, JSON.stringify(preview.before_snapshot)],
      ),
    );
  statements.push(...contentStatements(preview.before_snapshot, after));
  statements.push(
    q(
      `INSERT INTO plan_excel_revisions(plan_id,revision,actor,operation,summary,snapshot) SELECT $1,COALESCE(MAX(revision),0)+1,'admin',$2,$3::jsonb,$4::jsonb FROM plan_excel_revisions WHERE plan_id=$1`,
      [
        preview.plan_id,
        preview.operation,
        JSON.stringify(summary(changes)),
        JSON.stringify(after),
      ],
    ),
  );
  statements.push(
    q(
      `UPDATE plan_excel_previews SET completed_at=now(),before_snapshot='{}',after_snapshot='{}',changes='[]' WHERE id=$1`,
      [id],
    ),
  );
  try {
    await db.transaction(statements);
  } catch (error) {
    // A simultaneous repeat can finish after the first read. Return the committed receipt.
    if ((await getPreview(db, id)).completed_at) return preview.plan_id;
    const message = String(error);
    if (message.includes("EXCEL_STALE"))
      throw new Error(
        "This plan changed after export or preview. Export a fresh workbook and review again.",
      );
    if (message.includes("EXCEL_PREVIEW_EXPIRED"))
      throw new Error("Preview expired. Upload again.");
    throw new Error(
      "The import could not be saved. No changes were committed. Check the migration and upload again.",
    );
  }
  return preview.plan_id;
}
export async function listRevisions(db: Database, planId: string) {
  return db.query(
    "SELECT id,revision,created_at,actor,operation,summary FROM plan_excel_revisions WHERE plan_id=$1 ORDER BY revision DESC LIMIT 100",
    [planId],
  );
}
export async function restorePreview(
  db: Database,
  planId: string,
  revisionId: string,
) {
  const state = await readState(db, planId);
  const rows = await db.query(
    "SELECT snapshot FROM plan_excel_revisions WHERE id=$1 AND plan_id=$2",
    [revisionId, planId],
  );
  if (!rows[0]) throw new Error("Revision not found for this plan.");
  const after = rows[0].snapshot as Snapshot;
  if (after.plans[0]?.id !== planId)
    throw new Error("Revision belongs to another plan.");
  return savePreview(db, {
    plan_id: planId,
    customer_id: null,
    operation: "RESTORE",
    expected_version: state.version,
    before_snapshot: state.snapshot,
    after_snapshot: after,
    changes: diffSnapshots(state.snapshot, after),
  });
}
export function describeRecord(row: RecordData | null) {
  return String(row?.name || row?.title || row?.day_label || row?.id || "");
}
