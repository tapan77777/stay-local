#!/usr/bin/env node
// Explicit nonproduction target only. Never loads .env.local or DATABASE_URL.
// node --env-file=.env.excel-staging.local scripts/plan-migrate.mjs --check
// node --env-file=.env.excel-staging.local scripts/plan-migrate.mjs --apply --only-excel
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
import {
  SCHEMA_FILES,
  applyMigration,
  migrationTarget,
  legacyImportCommands,
} from "./plan-migration-core.mjs";

async function run() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "Usage: node --env-file=<private staging file> scripts/plan-migrate.mjs --check | --apply [--only-excel] [--import-json]",
    );
    console.log(
      "Requires PLAN_MIGRATION_ENV=staging|development, PLAN_MIGRATION_DATABASE_URL (direct Neon), PLAN_MIGRATION_EXPECTED_HOST, PLAN_MIGRATION_EXPECTED_BRANCH_ID. DATABASE_URL/.env.local are never used. Optional --import-json includes data/plan/db.json in the same guarded transaction.",
    );
    return;
  }
  if (
    args.some(
      (arg) =>
        !["--check", "--apply", "--only-excel", "--import-json"].includes(arg),
    ) ||
    args.includes("--check") === args.includes("--apply")
  )
    throw new Error("Choose exactly --check or --apply; see --help.");
  // Read only this URL's hostname as a denylist, without loading ambient secrets.
  let protectedHosts = [];
  try {
    const local = await readFile(
      new URL("../.env.local", import.meta.url),
      "utf8",
    );
    const match = local.match(/^\s*DATABASE_URL\s*=\s*(.*?)\s*$/m);
    if (match) {
      const raw = match[1].replace(/^['"]|['"]$/g, "");
      protectedHosts = [new URL(raw).hostname];
    }
  } catch (error) {
    if (error.code !== "ENOENT")
      throw new Error(
        "Explicit migration cannot validate protected local configuration.",
      );
  }
  const target = migrationTarget(process.env, protectedHosts);
  const files = args.includes("--only-excel")
    ? ["schema-6-excel.sql"]
    : SCHEMA_FILES;
  // Read every expected file BEFORE connecting; missing files are errors, never silently skipped.
  const sources = await Promise.all(
    files.map((file) =>
      readFile(new URL(`../lib/plan/${file}`, import.meta.url), "utf8"),
    ),
  );
  let dataCommands = [];
  if (args.includes("--import-json")) {
    try {
      dataCommands = legacyImportCommands(
        JSON.parse(
          await readFile(
            new URL("../data/plan/db.json", import.meta.url),
            "utf8",
          ),
        ),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const client = neon(target.url);
  const [rows] = await client.transaction(
    [client.query("SELECT current_setting('neon.branch_id',true) AS branch")],
    { readOnly: true },
  );
  if (rows[0]?.branch !== target.branch)
    throw new Error(
      "Neon branch identity differs from the explicitly approved target. No migration applied.",
    );
  console.log(
    `Verified explicitly configured ${target.environment} branch. No credentials logged.`,
  );
  if (args.includes("--check")) {
    console.log("Read-only preflight complete. No migration applied.");
    return;
  }
  const count = await applyMigration(client, sources, dataCommands);
  console.log(
    `Committed ${files.length} schema file(s), ${count} statements, in one transaction.`,
  );
}
run().catch((error) => {
  // Connection errors may contain credentials/parameters; never print raw errors.
  const code = /^[A-Z0-9]{5}$/.test(error?.code || "")
    ? ` SQLSTATE ${error.code}.`
    : "";
  const safe =
    error instanceof Error &&
    !error.code &&
    !error.sourceError &&
    !/postgres(?:ql)?:\/\//i.test(error.message) &&
    /^(Set PLAN_|Explicit migration|Invalid migration|Migration requires|Migration target|An explicit|Choose exactly|Neon branch|ENOENT)/.test(
      error.message,
    )
      ? ` ${error.message}`
      : "";
  console.error(
    `Migration/preflight failed.${code}${safe} No partial schema transaction was committed. See --help and verify the private staging configuration.`,
  );
  process.exitCode = 1;
});
