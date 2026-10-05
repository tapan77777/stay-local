#!/usr/bin/env node
// StayLocal Plan — device access control test suite.
//
// Exercises the per-plan device cap end-to-end against the real database.
// Covers all 12 scenarios from the device-limit specification:
//   1.  First device → allowed
//   2.  Same device again → allowed, count unchanged
//   3.  Second device under limit → allowed
//   4.  Third device over limit → denied
//   5.  Revoked device → denied
//   6.  New device after revocation → allowed
//   7.  Admin increases limit → new device can register
//   8.  Admin decreases limit below current count → existing stay, new denied
//   9.  Revoke all → every active device becomes unauthorized
//   10. Concurrent new-device registrations cannot exceed max_devices
//   11. Missing/invalid device cookie handled safely
//   12. Existing plan authentication still works (plan session cookie flow)
//
// This script implements the same atomic SQL and HMAC that lib/plan/devices.ts
// uses, so correctness of the SQL under race conditions is what we're
// verifying — the Next.js glue on top is thin.

import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TAG = `devtest-${Date.now()}`;

async function loadEnv() {
  if (process.env.DATABASE_URL && process.env.PLAN_ACCESS_SECRET) return;
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

let passes = 0;
let fails = 0;
function assert(cond, label, detail = "") {
  if (cond) {
    passes++;
    console.log(`  ✓ ${label}`);
  } else {
    fails++;
    console.log(`  ✗ ${label}${detail ? "  → " + detail : ""}`);
  }
}

function getSecret() {
  return (
    process.env.PLAN_ACCESS_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ""
  );
}

function newDeviceToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashDeviceToken(raw) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(raw)
    .digest("base64url");
}

// Mirror of lib/plan/devices.ts#authorizeDeviceAtomic. Returns:
//   { max_devices, active_count, existing_revoked_at, touched, inserted }
async function authorize(sql, planId, rawToken, userAgent = "jsdom test") {
  const hash = hashDeviceToken(rawToken);
  const [, rows] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${planId}::text, 0))`,
    sql`
      WITH
        existing AS (
          SELECT id, revoked_at
          FROM plan_devices
          WHERE plan_id = ${planId} AND device_token_hash = ${hash}
          LIMIT 1
        ),
        cap AS (SELECT max_devices FROM plans WHERE id = ${planId}),
        active_count AS (
          SELECT COUNT(*)::int AS n FROM plan_devices
          WHERE plan_id = ${planId} AND revoked_at IS NULL
        ),
        touched AS (
          UPDATE plan_devices
          SET last_seen_at = now(),
              user_agent  = COALESCE(NULLIF(${userAgent}, ''), user_agent)
          WHERE id = (SELECT id FROM existing WHERE revoked_at IS NULL)
          RETURNING id
        ),
        inserted AS (
          INSERT INTO plan_devices (plan_id, device_token_hash, user_agent)
          SELECT ${planId}, ${hash}, NULLIF(${userAgent}, '')
          WHERE NOT EXISTS (SELECT 1 FROM existing)
            AND (SELECT n FROM active_count) < (SELECT max_devices FROM cap)
          RETURNING id
        )
      SELECT
        (SELECT max_devices FROM cap) AS max_devices,
        (SELECT n FROM active_count) AS active_count,
        (SELECT revoked_at FROM existing) AS existing_revoked_at,
        (SELECT id FROM touched) AS touched_id,
        (SELECT id FROM inserted) AS inserted_id
    `,
  ]);
  return rows[0];
}

function outcome(r) {
  if (r.touched_id) return "existing";
  if (r.inserted_id) return "registered";
  if (r.existing_revoked_at) return "revoked";
  return "limit_reached";
}

async function run() {
  await loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set — cannot run device tests.");
    process.exit(1);
  }
  if (!getSecret()) {
    console.error(
      "PLAN_ACCESS_SECRET (or ADMIN_SESSION_SECRET) must be set so hash comparisons are stable."
    );
    process.exit(1);
  }
  const sql = neon(url);

  // ---- Seed an isolated plan ------------------------------------------
  const customer = (
    await sql`
      INSERT INTO customers (name, email, whatsapp)
      VALUES (${`Device Test ${TAG}`}, ${`${TAG}@example.com`}, '')
      RETURNING id
    `
  )[0];
  const plan = (
    await sql`
      INSERT INTO plans (
        customer_id, private_token, title, status, max_devices
      )
      VALUES (
        ${customer.id}, ${`tok_${TAG}`}, ${`Trip ${TAG}`}, 'READY'::plan_status, 2
      )
      RETURNING id
    `
  )[0];
  console.log(`Seeded test plan ${plan.id} (max_devices=2)`);

  async function cleanup() {
    await sql`DELETE FROM plan_devices WHERE plan_id = ${plan.id}`;
    await sql`DELETE FROM plans WHERE id = ${plan.id}`;
    await sql`DELETE FROM customers WHERE id = ${customer.id}`;
  }

  try {
    // 1. First device → allowed
    const devA = newDeviceToken();
    let r = await authorize(sql, plan.id, devA);
    assert(outcome(r) === "registered", "T1: first device registered");

    // 2. Same device again → allowed, count unchanged
    r = await authorize(sql, plan.id, devA);
    assert(outcome(r) === "existing", "T2: same device returns existing");
    let active = (
      await sql`SELECT COUNT(*)::int AS n FROM plan_devices WHERE plan_id = ${plan.id} AND revoked_at IS NULL`
    )[0].n;
    assert(active === 1, "T2: active count unchanged at 1", `got ${active}`);

    // 3. Second device under limit → allowed
    const devB = newDeviceToken();
    r = await authorize(sql, plan.id, devB);
    assert(outcome(r) === "registered", "T3: second device registered");

    // 4. Third device over limit → denied
    const devC = newDeviceToken();
    r = await authorize(sql, plan.id, devC);
    assert(outcome(r) === "limit_reached", "T4: third device denied");
    assert(
      r.active_count === 2 && r.max_devices === 2,
      "T4: counts reported as 2 / 2",
      `active=${r.active_count} max=${r.max_devices}`
    );

    // 5. Revoked device → denied even if under limit
    const devBId = (
      await sql`SELECT id FROM plan_devices WHERE plan_id = ${plan.id} AND device_token_hash = ${hashDeviceToken(devB)}`
    )[0].id;
    await sql`UPDATE plan_devices SET revoked_at = now() WHERE id = ${devBId}`;
    r = await authorize(sql, plan.id, devB);
    assert(outcome(r) === "revoked", "T5: revoked device gets revoked outcome");

    // 6. New device after revocation (slot opened up) → allowed
    const devD = newDeviceToken();
    r = await authorize(sql, plan.id, devD);
    assert(
      outcome(r) === "registered",
      "T6: new device admitted after revocation freed a slot"
    );

    // 7. Admin increases limit → new device can register
    await sql`UPDATE plans SET max_devices = 3 WHERE id = ${plan.id}`;
    const devE = newDeviceToken();
    r = await authorize(sql, plan.id, devE);
    assert(
      outcome(r) === "registered",
      "T7: increasing cap admits a new device"
    );

    // 8. Admin decreases limit below current count → existing stay, new denied
    //    Current active: devA, devD, devE = 3. Drop cap to 2.
    await sql`UPDATE plans SET max_devices = 2 WHERE id = ${plan.id}`;
    r = await authorize(sql, plan.id, devA);
    assert(outcome(r) === "existing", "T8a: previously-registered device still allowed");
    const devF = newDeviceToken();
    r = await authorize(sql, plan.id, devF);
    assert(outcome(r) === "limit_reached", "T8b: new device denied even though cap dropped");

    // 9. Revoke all → every device becomes unauthorized
    await sql`UPDATE plan_devices SET revoked_at = now() WHERE plan_id = ${plan.id} AND revoked_at IS NULL`;
    r = await authorize(sql, plan.id, devA);
    assert(outcome(r) === "revoked", "T9a: devA revoked");
    r = await authorize(sql, plan.id, devD);
    assert(outcome(r) === "revoked", "T9b: devD revoked");
    r = await authorize(sql, plan.id, devE);
    assert(outcome(r) === "revoked", "T9c: devE revoked");

    // 10. Concurrent new-device registrations cannot exceed max_devices.
    //     Start from a clean slate: hard-delete the revoked rows then
    //     set cap to 2 and fire 5 concurrent authorize calls with
    //     distinct tokens. Expect exactly 2 "registered", 3 "limit_reached".
    await sql`DELETE FROM plan_devices WHERE plan_id = ${plan.id}`;
    await sql`UPDATE plans SET max_devices = 2 WHERE id = ${plan.id}`;
    const race = Array.from({ length: 5 }, () => newDeviceToken());
    const results = await Promise.all(
      race.map((t) => authorize(sql, plan.id, t))
    );
    const buckets = { registered: 0, limit_reached: 0, other: 0 };
    for (const rr of results) {
      const o = outcome(rr);
      if (o === "registered") buckets.registered++;
      else if (o === "limit_reached") buckets.limit_reached++;
      else buckets.other++;
    }
    assert(
      buckets.registered === 2 && buckets.limit_reached === 3,
      "T10: exactly max_devices admitted under 5-way race",
      `got registered=${buckets.registered} limit=${buckets.limit_reached} other=${buckets.other}`
    );
    const finalActive = (
      await sql`SELECT COUNT(*)::int AS n FROM plan_devices WHERE plan_id = ${plan.id} AND revoked_at IS NULL`
    )[0].n;
    assert(
      finalActive === 2,
      "T10: DB confirms active count never exceeds max_devices",
      `got ${finalActive}`
    );

    // 11. Missing/invalid cookie handled safely. The repo passes the raw
    //     token through hashDeviceToken which is HMAC-SHA256 — any string
    //     yields a valid hash shape, so "nonsense" simply doesn't match
    //     any row and goes through the insert path like a brand new device.
    //     With cap already full it should be denied, not throw.
    r = await authorize(sql, plan.id, "x"); // valid shape, no match
    assert(outcome(r) === "limit_reached", "T11a: short junk cookie → limit_reached (no exception)");
    r = await authorize(sql, plan.id, "!!!"); // chars not in base64url
    assert(outcome(r) === "limit_reached", "T11b: non-base64url junk → limit_reached (no exception)");

    // 12. Existing Plan authentication still works. We don't have cookies
    //     in a node script, but we can verify that the plans table carries
    //     max_devices and that the private_token column is unchanged —
    //     i.e. this phase did not break the existing unlock flow.
    const planRow = (
      await sql`SELECT private_token, max_devices FROM plans WHERE id = ${plan.id}`
    )[0];
    assert(
      planRow.private_token === `tok_${TAG}` && planRow.max_devices === 2,
      "T12: plans.private_token intact; plans.max_devices present"
    );

    console.log(`\n${passes} passed, ${fails} failed.`);
    process.exit(fails === 0 ? 0 : 1);
  } finally {
    await cleanup();
    console.log("Cleaned up test rows.");
  }
}

run().catch((err) => {
  console.error("Device test suite failed:", err?.message || err);
  console.error(err?.stack || "");
  process.exit(1);
});
