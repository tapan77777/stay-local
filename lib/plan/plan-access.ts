import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "sl_plan_";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface PlanSessionPayload {
  v: 1;
  pid: string;
  name: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret =
    process.env.PLAN_ACCESS_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";
  if (!secret) {
    throw new Error(
      "PLAN_ACCESS_SECRET (or ADMIN_SESSION_SECRET) is not configured."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function cookieNameFor(planId: string): string {
  // One cookie per plan ID so multiple plans on one device coexist.
  const safe = planId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `${COOKIE_PREFIX}${safe}`;
}

function encode(payload: PlanSessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decode(token: string): PlanSessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (!timingSafeEqualStr(sig, expected)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as PlanSessionPayload;
    if (payload.v !== 1) return null;
    if (typeof payload.exp !== "number" || Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createPlanSession(
  planId: string,
  name: string
): Promise<void> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: PlanSessionPayload = {
    v: 1,
    pid: planId,
    name,
    iat,
    exp: iat + DEFAULT_TTL_SECONDS,
  };
  const token = encode(payload);
  const jar = await cookies();
  jar.set(cookieNameFor(planId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEFAULT_TTL_SECONDS,
  });
}

export async function getPlanSession(
  planId: string
): Promise<PlanSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(cookieNameFor(planId))?.value;
  if (!token) return null;
  try {
    const payload = decode(token);
    if (!payload || payload.pid !== planId) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function destroyPlanSession(planId: string): Promise<void> {
  const jar = await cookies();
  jar.set(cookieNameFor(planId), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
