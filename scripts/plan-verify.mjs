#!/usr/bin/env node
// One-off: inspect the Phase 1 schema on Neon.

import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function loadEnv() {
  if (process.env.DATABASE_URL) return;
  for (const name of [".env.local", ".env"]) {
    try {
      const raw = await fs.readFile(path.join(ROOT, name), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        if (process.env[key]) continue;
        let val = m[2];
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    } catch (err) {
      if (err && err.code !== "ENOENT") throw err;
    }
  }
}

async function run() {
  await loadEnv();
  const sql = neon(process.env.DATABASE_URL);

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('customers', 'plans')
    ORDER BY table_name
  `;
  console.log("Tables:");
  for (const t of tables) console.log("  ✓", t.table_name);

  const customerCols = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers'
    ORDER BY ordinal_position
  `;
  console.log("\ncustomers columns:");
  for (const c of customerCols) {
    console.log(
      `  ${c.column_name.padEnd(14)} ${c.data_type.padEnd(28)} ${c.is_nullable === "NO" ? "NOT NULL" : "NULL    "} ${c.column_default ?? ""}`
    );
  }

  const planCols = await sql`
    SELECT column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans'
    ORDER BY ordinal_position
  `;
  console.log("\nplans columns:");
  for (const c of planCols) {
    const type =
      c.data_type === "USER-DEFINED" ? `enum(${c.udt_name})` : c.data_type;
    console.log(
      `  ${c.column_name.padEnd(18)} ${type.padEnd(28)} ${c.is_nullable === "NO" ? "NOT NULL" : "NULL"}`
    );
  }

  const indexes = await sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename IN ('customers', 'plans')
    ORDER BY tablename, indexname
  `;
  console.log("\nIndexes:");
  for (const i of indexes) console.log(`  ${i.indexname}: ${i.indexdef}`);

  const fks = await sql`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name  AS references_table,
      ccu.column_name AS references_column,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `;
  console.log("\nForeign keys:");
  for (const fk of fks) {
    console.log(
      `  ${fk.constraint_name}: ${fk.column_name} → ${fk.references_table}(${fk.references_column}) ON DELETE ${fk.delete_rule}`
    );
  }

  const enumVals = await sql`
    SELECT enumlabel
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'plan_status'
    ORDER BY enumsortorder
  `;
  console.log("\nplan_status enum values:");
  console.log("  ", enumVals.map((e) => e.enumlabel).join(", "));

  const [{ nc }] = await sql`SELECT COUNT(*)::int AS nc FROM customers`;
  const [{ np }] = await sql`SELECT COUNT(*)::int AS np FROM plans`;
  console.log(`\nRow counts: customers=${nc}, plans=${np}`);
}

run().catch((err) => {
  console.error("Verification failed:", err?.message || err);
  process.exit(1);
});
