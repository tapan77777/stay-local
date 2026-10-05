import "server-only";
import type { ReactNode } from "react";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getPlanByToken, evaluatePlanAccess } from "./plans";
import { getPlanSession } from "./plan-access";
import {
  findActiveDeviceByCookie,
  readDeniedSignal,
  touchDeviceLastSeen,
} from "./devices";
import {
  listDestinations,
  listDestinationModuleCounts,
} from "./destinations";
import { PlanAccessForm } from "@/components/plan/plan-access-form";
import { PlanUnavailable } from "@/components/plan/plan-unavailable";
import { PlanDeviceLimit } from "@/components/plan/plan-device-limit";
import type {
  Destination,
  DestinationModuleCounts,
  PlanWithCustomer,
} from "./types";

/*
 * Shared customer-side view helpers. The admin builder has its own set of
 * repository functions; this module is specifically what the authenticated
 * traveler UI reaches for so pages don't each reimplement the auth check or
 * the destinations-with-counts aggregation.
 */

export interface PlanSessionInfo {
  pid: string;
  name: string;
}

export type PlanAuthResult =
  | { ok: true; plan: PlanWithCustomer; session: PlanSessionInfo }
  | { ok: false; render: ReactNode };

/**
 * Read-only plan + device authentication for Server Components.
 *
 * Runs the same ordered checks as before — plan exists, status/window,
 * plan session cookie — then adds a *read-only* device check: the device
 * cookie is hashed and looked up; if it matches an active row we touch
 * `last_seen_at` (SQL UPDATE, no cookie mutation) and admit the request.
 *
 * When the device cookie is missing or stale, we must register it, but
 * cookie writes are forbidden during Server Component rendering in
 * Next.js 16. So we `redirect()` the browser to the bootstrap Route
 * Handler at `/plan/<token>/device`, which runs the atomic authorize,
 * sets the device cookie on its response, and redirects back to the
 * originally requested URL (via Referer).
 *
 * When the bootstrap has just denied access (limit reached or revoked
 * device), it drops a short-lived `sl_dev_denied_<pid>` signal cookie
 * that we read here to render the polished `PlanDeviceLimit` state
 * without looping back to the bootstrap.
 *
 * Memoized per-request so the layout and child page components can each
 * call it without issuing duplicate DB queries.
 */
export const authenticatePlan = cache(async function authenticatePlan(
  token: string
): Promise<PlanAuthResult> {
  const plan = await getPlanByToken(token);
  // Deliberately indistinguishable from "code wrong" so a scraper cannot
  // enumerate real tokens by comparing error states.
  if (!plan) {
    return { ok: false, render: <PlanAccessForm token={token} /> };
  }
  const access = evaluatePlanAccess(plan);
  if (!access.ok) {
    return { ok: false, render: <PlanUnavailable /> };
  }
  const session = await getPlanSession(plan.id);
  if (!session) {
    return { ok: false, render: <PlanAccessForm token={token} /> };
  }

  // Device gate — read-only.
  const device = await findActiveDeviceByCookie(plan.id);
  if (device) {
    // No cookie mutation here — just an UPDATE row.
    await touchDeviceLastSeen(device.id);
    return {
      ok: true,
      plan,
      session: { pid: session.pid, name: session.name },
    };
  }

  // No valid device cookie. If the bootstrap just denied us, render the
  // polished limit state instead of looping back to it.
  const denied = await readDeniedSignal(plan.id);
  if (denied) {
    return {
      ok: false,
      render: (
        <PlanDeviceLimit
          planTitle={plan.title || "your trip"}
          activeCount={denied.activeCount}
          maxDevices={denied.maxDevices}
          whatsappContact={plan.whatsappContact}
        />
      ),
    };
  }

  // Otherwise, hand off to the Route Handler to atomically register this
  // device (or set the denial signal, which we'll pick up on the next
  // render). The Referer header carries the original URL so the handler
  // can send the browser back to it.
  redirect(`/plan/${token}/device`);
});

export interface DestinationWithCounts {
  destination: Destination;
  counts: DestinationModuleCounts;
  activeModuleCount: number;
}

export interface PlanOverview {
  destinations: DestinationWithCounts[];
  totalDestinations: number;
  totalNights: number;
}

const ZERO_COUNTS: DestinationModuleCounts = {
  itinerary: 0,
  places: 0,
  transport: 0,
  stays: 0,
  food: 0,
  experiences: 0,
  map: 0,
  notes: 0,
};

function countActiveModules(c: DestinationModuleCounts): number {
  let n = 0;
  if (c.itinerary > 0) n++;
  if (c.places > 0) n++;
  if (c.transport > 0) n++;
  if (c.stays > 0) n++;
  if (c.food > 0) n++;
  if (c.experiences > 0) n++;
  if (c.map > 0) n++;
  if (c.notes > 0) n++;
  return n;
}

/**
 * Loads destinations + module counts for a plan in two parallel queries.
 * Cached so the Trip Home → Journey → Destination Hub navigation can all
 * hit the same request-scoped result when they share a token.
 */
export const loadPlanOverview = cache(async function loadPlanOverview(
  planId: string
): Promise<PlanOverview> {
  const [destinations, counts] = await Promise.all([
    listDestinations(planId),
    listDestinationModuleCounts(planId),
  ]);
  const withCounts: DestinationWithCounts[] = destinations.map((d) => {
    const c = counts.get(d.id) ?? ZERO_COUNTS;
    return {
      destination: d,
      counts: c,
      activeModuleCount: countActiveModules(c),
    };
  });
  const totalNights = withCounts.reduce(
    (sum, d) => sum + (d.destination.nights ?? 0),
    0
  );
  return {
    destinations: withCounts,
    totalDestinations: withCounts.length,
    totalNights,
  };
});
