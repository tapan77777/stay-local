import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { neon } from "@neondatabase/serverless";
export const BRANCH = "br-cold-sea-b33m80x4";
export const PROJECT = "lucky-waterfall-84436365";
export const ROOT = new URL("../../", import.meta.url);
export const TABLES = [
  "customers",
  "plans",
  "destinations",
  "itinerary_days",
  "places",
  "transports",
  "stays",
  "foods",
  "experiences",
  "map_pins",
  "destination_notes",
  "india_guide_items",
  "plan_documents",
  "plan_devices",
];
export const ASSERT_TARGET = `DO $$ BEGIN IF current_setting('neon.branch_id',true) IS DISTINCT FROM '${BRANCH}' OR current_setting('neon.project_id',true) IS DISTINCT FROM '${PROJECT}' THEN RAISE EXCEPTION 'STAGING_IDENTITY_MISMATCH'; END IF; END $$`;
export async function configuration() {
  const e = parseEnv(
    await readFile(new URL(".env.excel-staging.local", ROOT), "utf8"),
  );
  if (
    e.PLAN_MIGRATION_ENV !== "staging" ||
    e.PLAN_MIGRATION_EXPECTED_BRANCH_ID !== BRANCH
  )
    throw new Error("STAGING_CONFIGURATION_MISMATCH");
  const direct = new URL(e.PLAN_MIGRATION_DATABASE_URL),
    app = new URL(e.DATABASE_URL);
  if (
    !direct.hostname.endsWith(".neon.tech") ||
    direct.hostname.includes("-pooler.") ||
    direct.hostname !== e.PLAN_MIGRATION_EXPECTED_HOST ||
    app.hostname.replace("-pooler.", ".") !== direct.hostname ||
    app.pathname !== direct.pathname
  )
    throw new Error("STAGING_ENDPOINT_MISMATCH");
  const protectedEnv = parseEnv(
    await readFile(new URL(".env.local", ROOT), "utf8"),
  );
  if (
    protectedEnv.DATABASE_URL &&
    new URL(protectedEnv.DATABASE_URL).hostname.replace("-pooler.", ".") ===
      direct.hostname
  )
    throw new Error("PROTECTED_ENDPOINT");
  return { env: e, direct, app, sql: neon(e.PLAN_MIGRATION_DATABASE_URL) };
}
export async function identity(config) {
  const [rows] = await config.sql.transaction(
    [
      config.sql.query(
        "SELECT current_setting('neon.branch_id',true) AS branch,current_setting('neon.project_id',true) AS project,current_setting('transaction_read_only') AS read_only",
      ),
    ],
    { readOnly: true },
  );
  if (
    rows[0]?.branch !== BRANCH ||
    rows[0]?.project !== PROJECT ||
    rows[0]?.read_only !== "on"
  )
    throw new Error("STAGING_IDENTITY_MISMATCH");
  return { branch: BRANCH, project: PROJECT, readOnlyIdentity: true };
}
export function pgEnvironment(url, extra = {}) {
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: url.searchParams.get("sslmode") || "require",
    PGCONNECT_TIMEOUT: "15",
    PGOPTIONS:
      "-c timezone=UTC -c default_transaction_read_only=on -c statement_timeout=120000 -c lock_timeout=5000",
    ...extra,
  };
}
export function fingerprintSQL(ids) {
  return `SELECT jsonb_build_object(${TABLES.flatMap((table) => ["'" + table + "'", `(SELECT jsonb_build_object('count',count(*)::int,'hash',md5(COALESCE(string_agg(md5((to_jsonb(t)-'content_version')::text),'' ORDER BY id),'')),'ids',COALESCE(jsonb_agg(id ORDER BY id),'[]'::jsonb)) FROM public.${table} t ${ids ? `WHERE id=ANY(ARRAY[${ids[table].ids.map((id) => "'" + id + "'::uuid").join(",")}]::uuid[])` : ""})`]).join(",")}) AS fingerprint`;
}
export const schemaSQL = `SELECT jsonb_build_object('columns',(SELECT jsonb_agg(jsonb_build_array(table_name,column_name,ordinal_position,is_nullable,data_type,udt_name,column_default) ORDER BY table_name,ordinal_position) FROM information_schema.columns WHERE table_schema='public'),'constraints',(SELECT jsonb_agg(jsonb_build_array(c.relname,k.conname,k.contype,pg_get_constraintdef(k.oid)) ORDER BY c.relname,k.conname) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'),'enums',(SELECT jsonb_agg(jsonb_build_array(t.typname,e.enumlabel,e.enumsortorder) ORDER BY t.typname,e.enumsortorder) FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public')) AS schema`;
export function safeFailure(error) {
  console.error(
    JSON.stringify({
      passed: false,
      reason: /^[A-Z_]+$/.test(error.message)
        ? error.message
        : "Operation failed; raw error suppressed to protect credentials/data.",
      sqlState: /^[A-Z0-9]{5}$/.test(error.code || "") ? error.code : null,
    }),
  );
  process.exitCode = 1;
}
