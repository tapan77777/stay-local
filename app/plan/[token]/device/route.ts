import { NextRequest, NextResponse } from "next/server";
import { getPlanByToken, evaluatePlanAccess } from "@/lib/plan/plans";
import { getPlanSession } from "@/lib/plan/plan-access";
import {
  applyAuthorizeOutcomeToResponse,
  authorizeDeviceAtomic,
  deviceCookieName,
} from "@/lib/plan/devices";

/*
 * Device bootstrap endpoint.
 *
 * Server Components cannot mutate cookies in Next.js 16 — so when the
 * authenticated plan view (`authenticatePlan`) sees no valid device
 * cookie, it `redirect()`s the browser here. This handler is a legal
 * cookie-mutation context: we run the atomic authorize, set the device
 * cookie (or a short-lived denial signal) on the redirect response, and
 * send the browser back to the page it was trying to reach.
 *
 * Return path: we rely on the Referer header. When the browser follows
 * the RSC redirect, Referer is the URL that returned the redirect, i.e.
 * the original plan sub-route. We validate it to the same /plan/<token>
 * prefix to prevent an attacker from using this endpoint as an open
 * redirect to an arbitrary URL.
 */

function resolveReturnPath(req: NextRequest, token: string): string {
  const fallback = `/plan/${encodeURIComponent(token)}`;
  const referer = req.headers.get("referer");
  if (!referer) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(referer);
  } catch {
    return fallback;
  }
  // Same origin as the current request only — never redirect across sites.
  const here = new URL(req.url);
  if (parsed.origin !== here.origin) return fallback;
  // Must be under /plan/<token>/… so a stray external referrer cannot
  // steer us to /admin or /. (We only care about the pathname + search.)
  const tokenPrefix = `/plan/${token}`;
  if (
    parsed.pathname !== tokenPrefix &&
    !parsed.pathname.startsWith(`${tokenPrefix}/`)
  ) {
    return fallback;
  }
  // Strip the bootstrap endpoint itself from the return path to avoid a
  // loop if someone pastes the handler URL directly.
  if (parsed.pathname === `${tokenPrefix}/device`) return fallback;
  return parsed.pathname + parsed.search;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  const plan = await getPlanByToken(token);
  // Any failure here — missing plan, closed window, no plan session —
  // sends the user back to the top-level plan URL where the regular
  // Server Component auth will render the access form or the unavailable
  // state. We deliberately do not leak which gate failed.
  if (!plan) {
    return NextResponse.redirect(new URL(`/plan/${token}`, req.url));
  }
  const access = evaluatePlanAccess(plan);
  if (!access.ok) {
    return NextResponse.redirect(new URL(`/plan/${token}`, req.url));
  }
  const session = await getPlanSession(plan.id);
  if (!session) {
    return NextResponse.redirect(new URL(`/plan/${token}`, req.url));
  }

  const existingCookie =
    req.cookies.get(deviceCookieName(plan.id))?.value ?? null;
  const ua = req.headers.get("user-agent") ?? "";
  const outcome = await authorizeDeviceAtomic(plan.id, existingCookie, ua);

  const res = NextResponse.redirect(
    new URL(resolveReturnPath(req, token), req.url)
  );
  applyAuthorizeOutcomeToResponse(res, plan.id, outcome);
  return res;
}
