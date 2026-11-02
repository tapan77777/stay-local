import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  configuration,
  identity,
  fingerprintSQL,
  BRANCH,
  PROJECT,
  ROOT,
  safeFailure,
} from "./guard.mjs";
const checksum = (data) => createHash("sha256").update(data).digest("hex");
try {
  const config = await configuration();
  console.log(await identity(config));
  const latest = JSON.parse(
    await readFile(
      new URL(".env.excel-predeploy/latest-recovery.json", ROOT),
      "utf8",
    ),
  );
  const receipt = JSON.parse(await readFile(latest.receipt, "utf8"));
  if (
    !receipt.backupPassed ||
    !receipt.restorePassed ||
    receipt.verifiedBranch !== BRANCH ||
    receipt.verifiedProject !== PROJECT
  )
    throw new Error("VERIFIED_RECOVERY_RECEIPT_REQUIRED");
  if (
    checksum(
      await readFile(receipt.backupDirectory + "/staging-before.dump"),
    ) !== receipt.sha256
  )
    throw new Error("BACKUP_CHECKSUM_CHANGED");
  const baseline = JSON.parse(
    await readFile(receipt.backupDirectory + "/baseline.private.json", "utf8"),
  ).baseline;
  const fingerprint = async () => {
    const results = await config.sql.transaction(
      [
        config.sql.query("SELECT set_config('TimeZone','UTC',true)"),
        config.sql.query(fingerprintSQL()),
      ],
      { readOnly: true },
    );
    return results[1][0].fingerprint;
  };
  if (JSON.stringify(await fingerprint()) !== JSON.stringify(baseline))
    throw new Error("STAGING_BASELINE_CHANGED_AFTER_RECOVERY");
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (key === "DATABASE_URL" || key.startsWith("PLAN_MIGRATION_"))
      delete env[key];
  const run = (flag) => {
    const r = spawnSync(
      process.execPath,
      [
        "--env-file=.env.excel-staging.local",
        "scripts/plan-migrate.mjs",
        flag,
        "--only-excel",
      ],
      { cwd: ROOT, env, encoding: "utf8", timeout: 330000 },
    );
    if (r.status !== 0)
      throw new Error(
        flag === "--check"
          ? "MIGRATION_PREFLIGHT_FAILED"
          : "STAGING_MIGRATION_FAILED",
      );
  };
  await identity(config);
  run("--check");
  console.log(JSON.stringify({ migrationPreflightPassed: true }));
  await identity(config);
  run("--apply");
  const [columnRows, tables, constraints, functions, triggers] =
    await config.sql.transaction(
      [
        config.sql.query(
          "SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='plans' AND column_name='content_version'",
        ),
        config.sql.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('plan_excel_previews','plan_excel_revisions')",
        ),
        config.sql.query(
          "SELECT t.relname AS table_name,c.contype,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname IN ('plan_excel_previews','plan_excel_revisions')",
        ),
        config.sql.query(
          "SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('sl_excel_guard','sl_excel_child_version','sl_excel_plan_version')",
        ),
        config.sql.query(
          "SELECT c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgname IN ('sl_excel_child_version','sl_excel_plan_version')",
        ),
      ],
      { readOnly: true },
    );
  if (
    columnRows[0]?.data_type !== "bigint" ||
    columnRows[0]?.is_nullable !== "NO" ||
    tables.length !== 2 ||
    functions.length !== 3 ||
    triggers.length !== 12 ||
    triggers.some((t) => t.tgenabled !== "O")
  )
    throw new Error("MIGRATION_OBJECT_VERIFICATION_FAILED");
  const has = (table, type, pattern) =>
    constraints.some(
      (c) =>
        c.table_name === table &&
        c.contype === type &&
        pattern.test(c.definition),
    );
  for (const table of ["plan_excel_previews", "plan_excel_revisions"])
    if (!has(table, "p", /PRIMARY KEY \(id\)/) || !has(table, "c", /operation/))
      throw new Error("MIGRATION_CONSTRAINT_VERIFICATION_FAILED");
  if (
    !has("plan_excel_previews", "u", /import_fingerprint/) ||
    !has(
      "plan_excel_previews",
      "f",
      /customer_id.*customers.*ON DELETE CASCADE/,
    ) ||
    !has("plan_excel_revisions", "u", /plan_id, revision/) ||
    !has("plan_excel_revisions", "f", /plan_id.*plans.*ON DELETE CASCADE/)
  )
    throw new Error("MIGRATION_CONSTRAINT_VERIFICATION_FAILED");
  if (JSON.stringify(await fingerprint()) !== JSON.stringify(baseline))
    throw new Error("BASELINE_DATA_CHANGED_DURING_MIGRATION");
  const result = {
    passed: true,
    branch: BRANCH,
    onlySchema6Applied: true,
    backupAndLocalRestoreVerified: true,
    baselineTablesUnchanged: 14,
    newTables: tables.length,
    newFunctions: functions.length,
    enabledVersionTriggers: triggers.length,
    constraintsVerified: true,
    sqlSha256: checksum(
      await readFile(new URL("lib/plan/schema-6-excel.sql", ROOT)),
    ),
    completedAt: new Date().toISOString(),
  };
  await writeFile(
    receipt.backupDirectory + "/migration-result.json",
    JSON.stringify(result, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(result));
} catch (error) {
  safeFailure(error);
}
