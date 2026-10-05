import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import type { NextResponse } from "next/server";
import { sql, timestampToString } from "./db";
import type { PlanDevice } from "./types";

/*
 * Per-plan device registry.
 *
 * Two cookies collaborate: `sl_plan_<pid>` (plan session) proves the customer
 * knows the private token; `sl_dev_<pid>` proves this browser is one of the
 * plan's registered devices. This file is the single source of truth for
 * both the atomic registration logic and the cookie plumbing.
 *
 * Device identity: a 32-byte random token stored only in an httpOnly cookie
 * on the client, with an HMAC-SHA256 of that token in the database. A DB
 * leak alone cannot be used to craft a valid cookie — the attacker would
 * also need `PLAN_ACCESS_SECRET`.
 *
 * Context rules (Next.js 16):
 *   - Server Components may READ cookies but must not mutate them.
 *   - Server Actions and Route Handlers are the only legal places to call
 *     `cookies().set()` / `.delete()`.
 *   - Accordingly, this module splits into two surfaces:
 *       (a) Read-only helpers (safe anywhere): `findActiveDeviceByCookie`,
 *           `touchDeviceLastSeen`, `readDeniedSignal`.
 *       (b) Mutating helpers (actions / route handlers only):
 *           `authorizeDeviceAtomic` returns an outcome without touching
 *           cookies, and the caller applies the outcome using either
 *           `applyAuthorizeOutcomeToResponse` (route handler) or
 *           `applyAuthorizeOutcomeToCookieJar` (server action).
 */

const DEVICE_COOKIE_PREFIX = "sl_dev_";
const DENIED_COOKIE_PREFIX = "sl_dev_denied_";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
// Short-lived denial signal: just long enough for the bootstrap round-trip
// to land back on the plan page. We do not want to persistently deny; the
// next request (after this expires) will re-attempt the atomic authorize
// in case the admin has freed a slot.
const DENIED_COOKIE_MAX_AGE = 60;
const DEVICE_TOKEN_BYTES = 32;

export function deviceCookieName(planId: string): string {
  const safe = planId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `${DEVICE_COOKIE_PREFIX}${safe}`;
}

export function deniedCookieName(planId: string): string {
  const safe = planId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `${DENIED_COOKIE_PREFIX}${safe}`;
}

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
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

export function newDeviceToken(): string {
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

// =========================================================================
// Read-only helpers — safe inside Server Components
// =========================================================================

export async function readDeviceCookie(planId: string): Promise<string | null> {
  const jar = await cookies();
  return jar.get(deviceCookieName(planId))?.value ?? null;
}

export async function readUserAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "";
}

/**
 * SELECT-only lookup — returns the active device row matching the current
 * cookie, or null. Does not mutate cookies.
 */
export async function findActiveDeviceByCookie(
  planId: string
): Promise<PlanDevice | null> {
  const raw = await readDeviceCookie(planId);
  if (!raw) return null;
  const hash = hashDeviceToken(raw);
  const rows = (await sql().query(
    `
    SELECT ${DEVICE_COLS}
    FROM plan_devices
    WHERE plan_id = $1 AND device_token_hash = $2 AND revoked_at IS NULL
    LIMIT 1
    `,
    [planId, hash]
  )) as DeviceRow[];
  if (!rows[0]) return null;
  return rowToDevice(rows[0]);
}

/**
 * UPDATE-only touch of last_seen_at. No cookie mutation — safe to call
 * from a Server Component after `findActiveDeviceByCookie` confirms a hit.
 */
export async function touchDeviceLastSeen(deviceId: string): Promise<void> {
  await sql().query(
    `UPDATE plan_devices SET last_seen_at = now() WHERE id = $1`,
    [deviceId]
  );
}

export interface DeniedSignal {
  activeCount: number;
  maxDevices: number;
}

/**
 * Reads the short-lived denial signal cookie dropped by the bootstrap
 * route handler when the atomic authorize came back with no slot. Returns
 * null if absent or malformed. Does not mutate cookies.
 */
export async function readDeniedSignal(
  planId: string
): Promise<DeniedSignal | null> {
  const jar = await cookies();
  const raw = jar.get(deniedCookieName(planId))?.value;
  if (!raw) return null;
  const parts = raw.split(":");
  if (parts.length !== 2) return null;
  const active = Number.parseInt(parts[0], 10);
  const max = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(active) || !Number.isFinite(max)) return null;
  return { activeCount: active, maxDevices: max };
}

// =========================================================================
// Atomic DB authorization — no cookie mutation
// =========================================================================

export type AuthorizeOutcome =
  | {
      outcome: "existing_active";
      activeCount: number;
      maxDevices: number;
      device: PlanDevice;
    }
  | {
      outcome: "registered_new";
      activeCount: number;
      maxDevices: number;
      device: PlanDevice;
      rawTokenToSet: string;
    }
  | {
      outcome: "revoked";
      activeCount: number;
      maxDevices: number;
    }
  | {
      outcome: "limit_reached";
      activeCount: number;
      maxDevices: number;
    };

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
 * Pure DB — does NOT mutate cookies. Callers (Route Handlers / Server
 * Actions) apply the outcome via `applyAuthorizeOutcomeToResponse` or
 * `applyAuthorizeOutcomeToCookieJar`.
 */
export async function authorizeDeviceAtomic(
  planId: string,
  existingCookieValue: string | null,
  userAgent: string
): Promise<AuthorizeOutcome> {
  const rawToken = existingCookieValue || newDeviceToken();
  const hash = hashDeviceToken(rawToken);
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
      [planId, hash, label, userAgent.slice(0, 500)]
    ),
  ])) as [unknown, AuthorizeRow[]];

  if (!row) {
    // Plan not found or SQL returned no row — defensively deny.
    return { outcome: "limit_reached", activeCount: 0, maxDevices: 0 };
  }
  if (row.touched) {
    return {
      outcome: "existing_active",
      activeCount: row.active_count,
      maxDevices: row.max_devices,
      device: rowToDevice(row.touched),
    };
  }
  if (row.existing_revoked_at != null) {
    return {
      outcome: "revoked",
      activeCount: row.active_count,
      maxDevices: row.max_devices,
    };
  }
  if (row.inserted) {
    return {
      outcome: "registered_new",
      activeCount: row.active_count,
      maxDevices: row.max_devices,
      device: rowToDevice(row.inserted),
      rawTokenToSet: rawToken,
    };
  }
  return {
    outcome: "limit_reached",
    activeCount: row.active_count,
    maxDevices: row.max_devices,
  };
}

// =========================================================================
// Cookie side effects — only legal from Server Actions or Route Handlers
// =========================================================================
//
// Two shapes: one that writes onto a `NextResponse` (for Route Handlers,
// which must return the response object), and one that writes through
// `cookies()` from `next/headers` (for Server Actions, which rely on
// Next.js propagating the mutations to the eventual response).

/** Route-handler side effect. */
export function applyAuthorizeOutcomeToResponse(
  res: NextResponse,
  planId: string,
  outcome: AuthorizeOutcome
): void {
  const base = cookieBaseOptions();
  switch (outcome.outcome) {
    case "registered_new":
      res.cookies.set(deviceCookieName(planId), outcome.rawTokenToSet, {
        ...base,
        maxAge: DEVICE_COOKIE_MAX_AGE,
      });
      // Clear any stale denial signal.
      res.cookies.set(deniedCookieName(planId), "", { ...base, maxAge: 0 });
      return;
    case "existing_active":
      res.cookies.set(deniedCookieName(planId), "", { ...base, maxAge: 0 });
      return;
    case "revoked":
      // Dead token — forget it on the client so the user doesn't loop with
      // a cookie that will never admit them again.
      res.cookies.set(deviceCookieName(planId), "", { ...base, maxAge: 0 });
      res.cookies.set(
        deniedCookieName(planId),
        `${outcome.activeCount}:${outcome.maxDevices}`,
        { ...base, maxAge: DENIED_COOKIE_MAX_AGE }
      );
      return;
    case "limit_reached":
      res.cookies.set(
        deniedCookieName(planId),
        `${outcome.activeCount}:${outcome.maxDevices}`,
        { ...base, maxAge: DENIED_COOKIE_MAX_AGE }
      );
      return;
  }
}

/** Server-action side effect. */
export async function applyAuthorizeOutcomeToCookieJar(
  planId: string,
  outcome: AuthorizeOutcome
): Promise<void> {
  const jar = await cookies();
  const base = cookieBaseOptions();
  switch (outcome.outcome) {
    case "registered_new":
      jar.set(deviceCookieName(planId), outcome.rawTokenToSet, {
        ...base,
        maxAge: DEVICE_COOKIE_MAX_AGE,
      });
      jar.set(deniedCookieName(planId), "", { ...base, maxAge: 0 });
      return;
    case "existing_active":
      jar.set(deniedCookieName(planId), "", { ...base, maxAge: 0 });
      return;
    case "revoked":
      jar.set(deviceCookieName(planId), "", { ...base, maxAge: 0 });
      jar.set(
        deniedCookieName(planId),
        `${outcome.activeCount}:${outcome.maxDevices}`,
        { ...base, maxAge: DENIED_COOKIE_MAX_AGE }
      );
      return;
    case "limit_reached":
      jar.set(
        deniedCookieName(planId),
        `${outcome.activeCount}:${outcome.maxDevices}`,
        { ...base, maxAge: DENIED_COOKIE_MAX_AGE }
      );
      return;
  }
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
