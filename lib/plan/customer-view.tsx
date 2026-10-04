import "server-only";
import type { ReactNode } from "react";
import { cache } from "react";
import { getPlanByToken, evaluatePlanAccess } from "./plans";
import { getPlanSession } from "./plan-access";
import {
  listDestinations,
  listDestinationModuleCounts,
} from "./destinations";
import { PlanAccessForm } from "@/components/plan/plan-access-form";
import { PlanUnavailable } from "@/components/plan/plan-unavailable";
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
 * Validates the token path parameter against our access rules in the same
 * order the original page.tsx used — plan existence, status/window, cookie
 * session. Memoized per-request so the layout and child page components can
 * each call it without issuing duplicate DB queries.
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
  return {
    ok: true,
    plan,
    session: { pid: session.pid, name: session.name },
  };
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
