#!/usr/bin/env node
// StayLocal Plan — Phase 1 database migration
//
// Usage:
//   DATABASE_URL=postgres://… node scripts/plan-migrate.mjs
//   DATABASE_URL=postgres://… node scripts/plan-migrate.mjs --import-json
//
// Flags:
//   --import-json     After creating the schema, insert rows from
//                     data/plan/db.json (the previous local JSON store).
//                     Existing rows (matched by id) are skipped.

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
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Put it in .env.local or export it before running this script."
    );
    process.exit(1);
  }

  const sql = neon(url);
  const schemaFiles = [
    "schema.sql",
    "schema-2a.sql",
    "schema-3-devices.sql",
    "schema-4-module-images.sql",
  ];
  for (const file of schemaFiles) {
    const schemaPath = path.join(ROOT, "lib", "plan", file);
    try {
      await fs.access(schemaPath);
    } catch {
      continue;
    }
    const schema = await fs.readFile(schemaPath, "utf8");
    const statements = splitSqlStatements(schema);
    console.log(
      `Applying ${statements.length} statement(s) from ${file}…`
    );
    for (const stmt of statements) {
      await sql.query(stmt);
    }
    console.log(`✓ ${file} applied.`);
  }

  if (process.argv.includes("--import-json")) {
    await importJson(sql);
  } else {
    const existing = await detectJsonStore();
    if (existing) {
      console.log(
        `\nFound existing JSON store at ${existing}. ` +
          "Run with --import-json to copy its rows into Postgres."
      );
    }
  }
}

function splitSqlStatements(src) {
  const out = [];
  let buf = "";
  let inDollar = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const next2 = src.slice(i, i + 2);
    if (next2 === "$$") {
      inDollar = !inDollar;
      buf += "$$";
      i += 1;
      continue;
    }
    if (c === ";" && !inDollar) {
      const trimmed = buf.trim();
      if (trimmed) out.push(trimmed);
      buf = "";
    } else {
      buf += c;
    }
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out
    .map((s) =>
      s
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(Boolean);
}

async function detectJsonStore() {
  const jsonPath = path.join(ROOT, "data", "plan", "db.json");
  try {
    await fs.access(jsonPath);
    return jsonPath;
  } catch {
    return null;
  }
}

async function importJson(sql) {
  const jsonPath = await detectJsonStore();
  if (!jsonPath) {
    console.log(
      "\nNo data/plan/db.json found — nothing to import. ✓"
    );
    return;
  }
  const raw = await fs.readFile(jsonPath, "utf8");
  const data = JSON.parse(raw);
  const customers = Array.isArray(data.customers) ? data.customers : [];
  const plans = Array.isArray(data.plans) ? data.plans : [];

  console.log(
    `\nImporting ${customers.length} customer(s) and ${plans.length} plan(s)…`
  );

  let importedCustomers = 0;
  let skippedCustomers = 0;
  for (const c of customers) {
    const result = await sql`
      INSERT INTO customers (id, name, email, whatsapp, created_at, updated_at)
      VALUES (${c.id}, ${c.name}, ${c.email}, ${c.whatsapp ?? ""}, ${c.createdAt}, ${c.updatedAt})
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) importedCustomers++;
    else skippedCustomers++;
  }

  let importedPlans = 0;
  let skippedPlans = 0;
  for (const p of plans) {
    const result = await sql`
      INSERT INTO plans (
        id, customer_id, private_token, title, subtitle,
        start_date, end_date, status,
        access_starts_at, access_ends_at,
        created_at, updated_at
      )
      VALUES (
        ${p.id}, ${p.customerId}, ${p.privateToken},
        ${p.title ?? ""}, ${p.subtitle ?? ""},
        ${p.startDate}, ${p.endDate}, ${p.status}::plan_status,
        ${p.accessStartsAt}, ${p.accessEndsAt},
        ${p.createdAt}, ${p.updatedAt}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) importedPlans++;
    else skippedPlans++;
  }

  console.log(
    `✓ Imported ${importedCustomers} customer(s) (skipped ${skippedCustomers}), ` +
      `${importedPlans} plan(s) (skipped ${skippedPlans}).`
  );
  console.log(
    `\nThe local JSON file remains at:\n  ${jsonPath}\n` +
      "Delete it when you're sure Postgres is the source of truth."
  );
}

run().catch((err) => {
  console.error("\nMigration failed:", err?.message || err);
  process.exit(1);
});
