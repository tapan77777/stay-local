import "server-only";
import crypto from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Returns the Neon tagged-template SQL function.
 * Lazy — only resolves `DATABASE_URL` when first used.
 * Never expose this to the browser (file is server-only).
 */
export function sql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Set it to your Neon Postgres connection string, then run `npm run plan:migrate`."
    );
  }
  _sql = neon(url);
  return _sql;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function newPrivateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Converts a Postgres DATE column value to a `yyyy-mm-dd` string (UTC).
 * Returns null when the column is NULL.
 */
export function dateToString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    const yyyy = v.getUTCFullYear();
    const mm = String(v.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(v.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof v === "string") return v.slice(0, 10);
  return null;
}

/**
 * Converts a Postgres TIMESTAMPTZ column value to an ISO-8601 string.
 * Returns null when the column is NULL.
 */
export function timestampToString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}
