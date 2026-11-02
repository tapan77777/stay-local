// Preload for legacy SQL tests. All Neon fetches execute in disposable PGlite;
// no configured remote database or private environment values are read.
import { PGlite } from "@electric-sql/pglite";
import { neonConfig } from "@neondatabase/serverless";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const bridge = process.env.STAYLOCAL_TEST_BRIDGE;
export const pg = bridge ? null : new PGlite();
for (const name of [
  "schema.sql",
  "schema-2a.sql",
  "schema-3-devices.sql",
  "schema-4-module-images.sql",
  "schema-5-profile-photo.sql",
  "schema-6-excel.sql",
])
  if (pg)
    await pg.exec(
      await readFile(new URL(`../lib/plan/${name}`, import.meta.url), "utf8"),
    );
process.env.DATABASE_URL = "postgresql://test:test@isolated.invalid/test";
process.env.PLAN_ACCESS_SECRET = "isolated-test-only-secret";
process.env.ADMIN_SESSION_SECRET = "isolated-test-only-admin-secret";
async function execute(client, query) {
  const result = await client.query(query.query, query.params);
  return {
    ...result,
    rows: result.rows.map((row) =>
      result.fields.map((field) => {
        const value = row[field.name];
        if (value == null) return null;
        if (value instanceof Date)
          return field.dataTypeID === 1082
            ? value.toISOString().slice(0, 10)
            : value.toISOString().replace("T", " ").replace("Z", "+00");
        if (typeof value === "boolean") return value ? "t" : "f";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      }),
    ),
  };
}
export async function isolatedFetch(_url, options) {
  if (bridge)
    return fetch(bridge, {
      ...options,
      headers: { "x-test-secret": process.env.STAYLOCAL_TEST_BRIDGE_SECRET },
    });
  try {
    const body = JSON.parse(options.body);
    const result = body.queries
      ? await pg.transaction(async (tx) => ({
          results: await Promise.all(
            body.queries.map((query) => execute(tx, query)),
          ),
        }))
      : await execute(pg, body);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { message: error.message, code: error.code, severity: "ERROR" },
      { status: 400 },
    );
  }
}
neonConfig.fetchFunction = isolatedFetch;
createRequire(import.meta.url)(
  "@neondatabase/serverless",
).neonConfig.fetchFunction = isolatedFetch;

// Next's production bundle may include its own Neon module copy. Intercept only
// the deliberately invalid test host, forwarding to our authenticated loopback bridge.
if (bridge) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const target =
      typeof input === "string" || input instanceof URL
        ? String(input)
        : input.url;
    if (new URL(target).hostname === "api.invalid")
      return isolatedFetch(target, init);
    return originalFetch(input, init);
  };
}
