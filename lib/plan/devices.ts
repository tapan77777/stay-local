import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { sql } from "./db";
import { timestampToString } from "./db";
import type { DeviceAuthResult, PlanDevice } from "./types";

/*
 * Per-plan device registry.
 *
 * The traveler's plan session (plan-access.ts) proves "this browser knows
 * the private token." This module adds a second gate: "this browser is one
 * of the plan's registered devices." The two cookies are intentionally
 * separate — if an admin rotates the plan token, every device re-authenticates
 * via the access form; if an admin revokes a single device, that one device
 * loses access without touching anyone else's session.
 *
 * Device identity: a 32-byte random token stored only in an httpOnly cookie
 * on the client, with a keyed SHA-256 of that token in the database. The
 * server-side HMAC key means a DB leak alone cannot be used to craft a
 * valid cookie — the attacker would also need PLAN_ACCESS_SECRET.
 */

// Cookie prefix is scoped per plan so a device registered for one plan
// doesn't accidentally pose as a device for another plan (which would be
// a privacy leak, not a security one — the plan session is a separate
// cookie — but keeping them scoped matches the plan session convention).
const DEVICE_COOKIE_PREFIX = "sl_dev_";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
const DEVICE_TOKEN_BYTES = 32;

function deviceCookieName(planId: string): string {
  const safe = planId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `${DEVICE_COOKIE_PREFIX}${safe}`;
}

function getHmacSecret(): string {
  const secret =
    process.env.PLAN_ACCESS_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";
  if (!secret) {
    throw new Error(
      "PLAN_ACCESS_SECRET (or ADMIN_SESSION_SECRET) is required for device hashing."
    );
  }
  return secret;
}

function newDeviceToken(): string {
  return crypto.randomBytes(DEVICE_TOKEN_BYTES).toString("base64url");
}

/**
 * Keyed hash of the raw device token. HMAC-SHA256 — deterministic (so the
 * UNIQUE INDEX on (plan_id, device_token_hash) works), but keyed with the
 * server secret so a DB dump cannot be rainbow-tabled back to raw tokens.
 */
export function hashDeviceToken(raw: string): string {
  return crypto
    .createHmac("sha256", getHmacSecret())
    .update(raw)
    .digest("base64url");
}

// Produce a short, non-sensitive label from the UA string so the admin
// device list is scannable. We never render raw UA to the admin; the full
// UA stays in the DB column for debugging only.
function deriveDeviceLabel(ua: string | null | undefined): string | null {
  const s = (ua || "").trim();
  if (!s) return null;
  if (/\biPhone\b/.test(s)) return "iPhone";
  if (/\biPad\b/.test(s)) return "iPad";
  if (/\biPod\b/.test(s)) return "iPod";
  if (/Android/.test(s) && /Mobile/.test(s)) return "Android phone";
  if (/Android/.test(s)) return "Android tablet";
  if (/CrOS/.test(s)) return "Chromebook";
  if (/Macintosh|Mac OS X/.test(s)) return "Mac";
  if (/Windows/.test(s)) return "Windows PC";
  if (/Linux/.test(s)) return "Linux";
  return "Browser";
}

interface DeviceRow {
  id: string;
  plan_id: string;
  device_label: string | null;
  user_agent: string | null;
  first_seen_at: unknown;
  last_seen_at: unknown;
  revoked_at: unknown;
  created_at: unknown;
}

function rowToDevice(r: DeviceRow): PlanDevice {
  return {
    id: r.id,
    planId: r.plan_id,
    deviceLabel: r.device_label,
    userAgent: r.user_agent,
    firstSeenAt: timestampToString(r.first_seen_at) ?? "",
    lastSeenAt: timestampToString(r.last_seen_at) ?? "",
    revokedAt: timestampToString(r.revoked_at),
    createdAt: timestampToString(r.created_at) ?? "",
  };
}

const DEVICE_COLS = `
  id,
  plan_id,
  device_label,
  user_agent,
  first_seen_at,
  last_seen_at,
  revoked_at,
  created_at
`;

export async function readDeviceCookie(planId: string): Promise<string | null> {
  const jar = await cookies();
  return jar.get(deviceCookieName(planId))?.value ?? null;
}

async function writeDeviceCookie(
  planId: string,
  raw: string
): Promise<void> {
  const jar = await cookies();
  jar.set(deviceCookieName(planId), raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
}

export async function clearDeviceCookie(planId: string): Promise<void> {
  const jar = await cookies();
  jar.set(deviceCookieName(planId), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function readUserAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "";
}

interface AuthorizeRow {
  max_devices: number;
  active_count: number;
  existing_revoked_at: unknown;
  touched: DeviceRow | null;
  inserted: DeviceRow | null;
}

/**
 * Atomic "register or acknowledge" device operation.
 *
 * Serialized per-plan with a transaction-scoped advisory lock, so two
 * concurrent requests for the SAME plan cannot both admit a new device
 * above max_devices. Different plans don't contend.
 *
 * The returned shape covers three cases:
 *   • existing active row → `touched` populated, caller updates last_seen_at
 *   • new row inserted    → `inserted` populated, caller sets device cookie
 *   • limit reached       → both null, active_count already at max_devices
 *   • existing revoked    → `existing_revoked_at` set, cookie must be cleared
 *
 * The caller does the "deny on revoked" branch so the cookie-clear side
 * effect is kept out of this DB function.
 */
async function authorizeDeviceAtomic(
  planId: string,
  tokenHash: string,
  userAgent: string
): Promise<AuthorizeRow | null> {
  const label = deriveDeviceLabel(userAgent);
  // Two queries in one HTTP transaction: statement-level snapshots in
  // READ COMMITTED mean query #2's reads see state as of its own start,
  // which happens AFTER query #1 acquires the advisory lock. That ordering
  // is what makes the limit race-free. Running these as separate HTTP
  // calls would NOT be safe (lock would release between calls).
  const [, [row]] = (await sql().transaction([
    sql().query(
      `SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))`,
      [planId]
    ),
    sql().query(
      `
      WITH
        existing AS (
          SELECT id, revoked_at
          FROM plan_devices
          WHERE plan_id = $1 AND device_token_hash = $2
          LIMIT 1
        ),
        cap AS (
          SELECT max_devices FROM plans WHERE id = $1
        ),
        active_count AS (
          SELECT COUNT(*)::int AS n
          FROM plan_devices
          WHERE plan_id = $1 AND revoked_at IS NULL
        ),
        touched AS (
          UPDATE plan_devices
          SET last_seen_at = now(),
              user_agent  = COALESCE(NULLIF($4, ''), user_agent),
              device_label = COALESCE(device_label, NULLIF($3, ''))
          WHERE id = (
            SELECT id FROM existing WHERE revoked_at IS NULL
          )
          RETURNING ${DEVICE_COLS}
        ),
        inserted AS (
          INSERT INTO plan_devices (
            plan_id, device_token_hash, device_label, user_agent
          )
          SELECT $1, $2, NULLIF($3, ''), NULLIF($4, '')
          WHERE NOT EXISTS (SELECT 1 FROM existing)
            AND (SELECT n FROM active_count) < (SELECT max_devices FROM cap)
          RETURNING ${DEVICE_COLS}
        )
      SELECT
        (SELECT max_devices FROM cap)                    AS max_devices,
        (SELECT n FROM active_count)                     AS active_count,
        (SELECT revoked_at FROM existing)                AS existing_revoked_at,
        (SELECT row_to_json(t) FROM touched t)           AS touched,
        (SELECT row_to_json(i) FROM inserted i)          AS inserted
      `,
      [planId, tokenHash, label, userAgent.slice(0, 500)]
    ),
  ])) as [unknown, AuthorizeRow[]];
  return row ?? null;
}

/**
 * Public entry point used by the plan auth path. Reads the cookie, hashes
 * it, runs the atomic authorize, and manages the cookie side effect.
 *
 * Returns a `DeviceAuthResult` the caller can switch on to render the right
 * UI without any further DB queries.
 */
export async function authorizeDevice(
  planId: string
): Promise<DeviceAuthResult> {
  const ua = await readUserAgent();
  const existing = await readDeviceCookie(planId);

  // No cookie → mint a fresh random token. Collision probability with any
  // existing row is negligible (2^-256), so we treat this as unconditionally
  // a new device slot request.
  const rawToken = existing || newDeviceToken();
  const hash = hashDeviceToken(rawToken);

  const row = await authorizeDeviceAtomic(planId, hash, ua);
  if (!row) {
    // Plan not found or SQL returned no row — defensively deny. The caller
    // should treat this as "not found", not as a limit-reached message.
    return {
      ok: false,
      status: "limit_reached",
      activeCount: 0,
      maxDevices: 0,
    };
  }

  // Case 1 — existing active row updated. Keep the cookie as-is.
  if (row.touched) {
    return { ok: true, status: "existing", device: rowToDevice(row.touched) };
  }

  // Case 2 — existing row found but revoked. Clear the cookie so the user
  // doesn't stay in a loop with a dead token, and surface the denial.
  if (row.existing_revoked_at != null) {
    await clearDeviceCookie(planId);
    return {
      ok: false,
      status: "limit_reached",
      activeCount: row.active_count,
      maxDevices: row.max_devices,
    };
  }

  // Case 3 — fresh insert succeeded. Persist the raw token in the cookie
  // so this browser is remembered across navigations.
  if (row.inserted) {
    if (!existing) {
      await writeDeviceCookie(planId, rawToken);
    }
    return { ok: true, status: "registered", device: rowToDevice(row.inserted) };
  }

  // Case 4 — nothing inserted, nothing touched → the active count was at
  // or above the cap. Deny with real numbers so the UI can show "2 / 2".
  return {
    ok: false,
    status: "limit_reached",
    activeCount: row.active_count,
    maxDevices: row.max_devices,
  };
}

// =========================================================================
// Admin-side helpers
// =========================================================================

export async function listPlanDevices(planId: string): Promise<PlanDevice[]> {
  const rows = (await sql().query(
    `
    SELECT ${DEVICE_COLS}
    FROM plan_devices
    WHERE plan_id = $1
    ORDER BY (revoked_at IS NULL) DESC, last_seen_at DESC
    `,
    [planId]
  )) as DeviceRow[];
  return rows.map(rowToDevice);
}

export async function countActiveDevicesByPlan(
  planIds: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (planIds.length === 0) return out;
  const rows = (await sql().query(
    `
    SELECT plan_id, COUNT(*)::int AS n
    FROM plan_devices
    WHERE revoked_at IS NULL AND plan_id = ANY($1::uuid[])
    GROUP BY plan_id
    `,
    [planIds]
  )) as { plan_id: string; n: number }[];
  for (const r of rows) out.set(r.plan_id, r.n);
  return out;
}

export async function countActiveDevices(planId: string): Promise<number> {
  const rows = (await sql().query(
    `
    SELECT COUNT(*)::int AS n
    FROM plan_devices
    WHERE plan_id = $1 AND revoked_at IS NULL
    `,
    [planId]
  )) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function revokeDevice(
  deviceId: string,
  planId: string
): Promise<boolean> {
  // Scoping the UPDATE to BOTH deviceId and planId is a defense-in-depth
  // check: even if an attacker tampered with the planId path param, they
  // could only revoke rows that actually belong to the plan they target.
  const rows = (await sql().query(
    `
    UPDATE plan_devices
    SET revoked_at = now()
    WHERE id = $1 AND plan_id = $2 AND revoked_at IS NULL
    RETURNING id
    `,
    [deviceId, planId]
  )) as { id: string }[];
  return rows.length > 0;
}

export async function revokeAllDevices(planId: string): Promise<number> {
  const rows = (await sql().query(
    `
    UPDATE plan_devices
    SET revoked_at = now()
    WHERE plan_id = $1 AND revoked_at IS NULL
    RETURNING id
    `,
    [planId]
  )) as { id: string }[];
  return rows.length;
}
