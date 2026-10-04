#!/usr/bin/env node
// End-to-end Phase 1 smoke test:
//   • seeds a customer + plan directly via SQL
//   • exercises the HTTP surface (/admin/*, /plan/[token])
//   • forges a signed admin cookie (same HMAC) to test authed pages
//   • tears everything down

import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.BASE_URL || "http://localhost:3101";
const TAG = `phase1-test-${Date.now()}`;

async function loadEnv() {
  if (process.env.DATABASE_URL && process.env.ADMIN_SESSION_SECRET) return;
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

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function signAdminCookie(secret, ttlSec = 60 * 60) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = { v: 1, sub: "admin", iat, exp: iat + ttlSec };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

async function fetchFollow(url, init = {}) {
  // Preserve redirects (don't auto-follow) so we can assert on 307s.
  return fetch(url, { redirect: "manual", ...init });
}

async function run() {
  await loadEnv();
  const sql = neon(process.env.DATABASE_URL);
  const SECRET = process.env.ADMIN_SESSION_SECRET;
  if (!SECRET) throw new Error("ADMIN_SESSION_SECRET missing");

  console.log(`\nBase URL: ${BASE}`);
  console.log(`Test tag: ${TAG}\n`);

  // ---------- Public safety ----------
  console.log("[1] Public site unchanged");
  {
    const r = await fetchFollow(`${BASE}/`);
    const body = await r.text();
    assert(r.status === 200, "GET / → 200");
    assert(
      body.includes("StayLocal") && body.includes("Services"),
      "home still renders navbar + brand"
    );
    const robots = await (await fetch(`${BASE}/robots.txt`)).text();
    assert(robots.includes("Disallow: /admin"), "/robots.txt disallows /admin");
    assert(robots.includes("Disallow: /plan"), "/robots.txt disallows /plan");
  }

  // ---------- Unauthed admin ----------
  console.log("\n[2] Admin gating");
  {
    const r1 = await fetchFollow(`${BASE}/admin`);
    assert(r1.status === 307, "GET /admin (unauthed) → 307", `got ${r1.status}`);
    assert(
      (r1.headers.get("location") || "").endsWith("/admin/login"),
      "redirect target is /admin/login"
    );
    const r2 = await fetchFollow(`${BASE}/admin/customers`);
    assert(r2.status === 307, "GET /admin/customers (unauthed) → 307");
    const r3 = await fetchFollow(`${BASE}/admin/plans/new`);
    assert(r3.status === 307, "GET /admin/plans/new (unauthed) → 307");

    const loginResp = await fetch(`${BASE}/admin/login`);
    const loginHtml = await loginResp.text();
    assert(loginResp.status === 200, "GET /admin/login → 200");
    assert(loginHtml.includes('name="password"'), "login form rendered");
    assert(
      loginHtml.includes('name="robots"') &&
        loginHtml.toLowerCase().includes("noindex"),
      "login page is noindex"
    );
  }

  // ---------- Seed data ----------
  console.log("\n[3] Seed via SQL (bypasses the UI)");
  const [customer] = await sql`
    INSERT INTO customers (name, email, whatsapp)
    VALUES (${"Phase1 " + TAG}, ${TAG + "@example.com"}, ${"+1 555 000 0000"})
    RETURNING id
  `;
  assert(!!customer?.id, "customer inserted", customer?.id);

  const tokenActive = crypto.randomBytes(24).toString("base64url");
  const tokenDisabled = crypto.randomBytes(24).toString("base64url");
  const tokenFuture = crypto.randomBytes(24).toString("base64url");
  const tokenExpired = crypto.randomBytes(24).toString("base64url");

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  const [planActive] = await sql`
    INSERT INTO plans (customer_id, private_token, title, subtitle, status, access_starts_at, access_ends_at)
    VALUES (${customer.id}, ${tokenActive}, ${"Rajasthan Discovery " + TAG}, ${"12 days"}, 'ACTIVE'::plan_status, ${yesterday}, ${nextWeek})
    RETURNING id, private_token
  `;
  const [planDisabled] = await sql`
    INSERT INTO plans (customer_id, private_token, title, status, access_starts_at, access_ends_at)
    VALUES (${customer.id}, ${tokenDisabled}, ${"Disabled " + TAG}, 'DISABLED'::plan_status, ${yesterday}, ${nextWeek})
    RETURNING id
  `;
  const [planFuture] = await sql`
    INSERT INTO plans (customer_id, private_token, title, status, access_starts_at, access_ends_at)
    VALUES (${customer.id}, ${tokenFuture}, ${"Future " + TAG}, 'READY'::plan_status, ${tomorrow}, ${nextWeek})
    RETURNING id
  `;
  const [planExpired] = await sql`
    INSERT INTO plans (customer_id, private_token, title, status, access_starts_at, access_ends_at)
    VALUES (${customer.id}, ${tokenExpired}, ${"Expired " + TAG}, 'COMPLETED'::plan_status, ${lastWeek}, ${yesterday})
    RETURNING id
  `;
  assert(
    planActive && planDisabled && planFuture && planExpired,
    "4 plan rows inserted (ACTIVE, DISABLED, future, expired)"
  );

  // ---------- Customer plan access ----------
  console.log("\n[4] /plan/[token] access gating");
  {
    const r = await fetch(`${BASE}/plan/${"zzznope" + TAG}`);
    const html = await r.text();
    assert(r.status === 200, "unknown token → 200");
    assert(
      html.includes("Your StayLocal Plan") && !html.includes("not found"),
      "unknown token shows generic access form (no info leak)"
    );
    assert(
      html.includes('name="robots"') &&
        html.toLowerCase().includes("noindex"),
      "/plan page is noindex"
    );
  }
  {
    const r = await fetch(`${BASE}/plan/${tokenDisabled}`);
    const html = await r.text();
    assert(
      html.includes("isn’t available") || html.includes("isn't available"),
      "DISABLED plan → friendly unavailable screen"
    );
    assert(
      !html.toLowerCase().includes("disabled plan") &&
        !html.includes("not found"),
      "no internal reason leaked for DISABLED"
    );
  }
  {
    const html = await (await fetch(`${BASE}/plan/${tokenFuture}`)).text();
    assert(
      html.includes("isn’t available") || html.includes("isn't available"),
      "pre-access-window plan → friendly unavailable screen"
    );
  }
  {
    const html = await (await fetch(`${BASE}/plan/${tokenExpired}`)).text();
    assert(
      html.includes("isn’t available") || html.includes("isn't available"),
      "post-access-window plan → friendly unavailable screen"
    );
  }
  {
    const r = await fetch(`${BASE}/plan/${tokenActive}`);
    const html = await r.text();
    assert(r.status === 200, "ACTIVE plan → 200");
    assert(
      html.includes("Access code") && html.includes('name="name"'),
      "ACTIVE plan without session → shows access form"
    );
  }

  // ---------- Authed admin ----------
  console.log("\n[5] Admin pages (authed via forged signed cookie)");
  const adminCookie = `sl_admin=${signAdminCookie(SECRET)}`;
  {
    const r = await fetchFollow(`${BASE}/admin`, {
      headers: { cookie: adminCookie },
    });
    const html = await r.text();
    assert(r.status === 200, "authed GET /admin → 200");
    assert(html.includes("Dashboard"), "dashboard renders");
    assert(
      html.includes("Rajasthan Discovery " + TAG),
      "seeded plan appears in recent plans"
    );
    assert(
      /name="robots"[^>]*noindex|robots[^>]*noindex/i.test(html),
      "admin dashboard is noindex"
    );
  }
  {
    const r = await fetch(`${BASE}/admin/customers`, {
      headers: { cookie: adminCookie },
    });
    const html = await r.text();
    assert(r.status === 200, "authed GET /admin/customers → 200");
    assert(
      html.includes("Phase1 " + TAG),
      "seeded customer appears in list"
    );
  }
  {
    const r = await fetch(`${BASE}/admin/plans`, {
      headers: { cookie: adminCookie },
    });
    const html = await r.text();
    assert(r.status === 200, "authed GET /admin/plans → 200");
    assert(
      html.includes("Rajasthan Discovery " + TAG) &&
        html.includes("Disabled " + TAG),
      "all seeded plans listed"
    );
  }
  {
    const r = await fetch(`${BASE}/admin/plans/${planActive.id}`, {
      headers: { cookie: adminCookie },
    });
    const html = await r.text();
    assert(r.status === 200, "authed GET /admin/plans/[id] → 200");
    assert(
      html.includes(tokenActive),
      "plan detail exposes the private token for copying"
    );
  }
  {
    const r = await fetch(`${BASE}/admin/plans/new`, {
      headers: { cookie: adminCookie },
    });
    assert(r.status === 200, "authed GET /admin/plans/new → 200");
  }
  // Public navbar must NOT render on admin pages
  {
    const r = await fetch(`${BASE}/admin`, {
      headers: { cookie: adminCookie },
    });
    const html = await r.text();
    const hasPublicNavLink =
      /href="\/experiences"[^>]*>Experiences/.test(html) ||
      /href="\/guides"[^>]*>Guides/.test(html);
    assert(
      !hasPublicNavLink,
      "public navbar NOT rendered inside /admin"
    );
  }

  // ---------- Admin invalid cookie ----------
  console.log("\n[6] Invalid admin cookie must be rejected");
  {
    const bad = `sl_admin=${signAdminCookie("wrong-secret")}`;
    const r = await fetchFollow(`${BASE}/admin`, { headers: { cookie: bad } });
    assert(
      r.status === 307 &&
        (r.headers.get("location") || "").endsWith("/admin/login"),
      "cookie signed with wrong secret → redirect to login"
    );
  }

  // ---------- Admin logout flow (expiry) ----------
  console.log("\n[7] Expired admin cookie must be rejected");
  {
    const iat = Math.floor(Date.now() / 1000) - 10_000;
    const payload = { v: 1, sub: "admin", iat, exp: iat + 1 };
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto
      .createHmac("sha256", SECRET)
      .update(body)
      .digest("base64url");
    const expired = `sl_admin=${body}.${sig}`;
    const r = await fetchFollow(`${BASE}/admin`, {
      headers: { cookie: expired },
    });
    assert(
      r.status === 307,
      "expired admin cookie → redirect"
    );
  }

  // ---------- Cleanup ----------
  console.log("\n[8] Cleanup");
  await sql`DELETE FROM plans WHERE customer_id = ${customer.id}`;
  await sql`DELETE FROM customers WHERE id = ${customer.id}`;
  const [{ nc }] = await sql`SELECT COUNT(*)::int AS nc FROM customers WHERE id = ${customer.id}`;
  assert(nc === 0, "test rows removed");

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
