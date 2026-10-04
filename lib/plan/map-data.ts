import "server-only";
import { cache } from "react";
import { sql } from "./db";

/*
 * Customer-map data loader.
 *
 * The only table in the schema that carries real latitude/longitude values is
 * `map_pins` — Phase 2A entries created by the admin alongside each
 * destination. The customer map renders those pins, not synthetic coordinates
 * derived from places/foods/stays/experiences (which the schema does not
 * store).
 *
 * One query per request. Rows without coordinates are filtered server-side
 * so no "no-op" markers ship to the client. The result is cached per request
 * so the Map page and any sibling callers share the fetch.
 */

export const PLAN_MAP_CATEGORIES = ["PLACE", "FOOD", "STAY", "EXPERIENCE"] as const;
export type PlanMapCategory = (typeof PLAN_MAP_CATEGORIES)[number];

export interface PlanMapPin {
  id: string;
  destinationId: string;
  destinationName: string;
  destinationPosition: number;
  name: string;
  lat: number;
  lng: number;
  category: PlanMapCategory;
  description: string;
  mapUrl: string;
}

export interface PlanMapDestination {
  id: string;
  name: string;
  position: number;
  pinCount: number;
}

export interface PlanMapData {
  pins: PlanMapPin[];
  destinations: PlanMapDestination[];
}

interface Row {
  id: string;
  destination_id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  map_url: string;
  destination_name: string;
  destination_position: number;
}

function isCustomerCategory(c: string): c is PlanMapCategory {
  return (PLAN_MAP_CATEGORIES as readonly string[]).includes(c);
}

export const loadPlanMapData = cache(async function loadPlanMapData(
  planId: string,
): Promise<PlanMapData> {
  const rows = (await sql().query(
    `
    SELECT
      mp.id,
      mp.destination_id,
      mp.name,
      mp.latitude,
      mp.longitude,
      mp.category::text AS category,
      mp.description,
      mp.map_url,
      d.name AS destination_name,
      d.position AS destination_position
    FROM map_pins mp
    JOIN destinations d ON d.id = mp.destination_id
    WHERE d.plan_id = $1
      AND mp.latitude  IS NOT NULL
      AND mp.longitude IS NOT NULL
    ORDER BY d.position ASC, mp.position ASC
    `,
    [planId],
  )) as Row[];

  const pins: PlanMapPin[] = [];
  const destMap = new Map<string, PlanMapDestination>();

  for (const r of rows) {
    // Customer map is scoped to the 4 content categories listed in the brief.
    // TRANSPORT and OTHER pins stay admin-only — their content surfaces
    // through the Transport module and Destination Hub respectively.
    if (!isCustomerCategory(r.category)) continue;
    if (!Number.isFinite(r.latitude) || !Number.isFinite(r.longitude)) continue;

    pins.push({
      id: r.id,
      destinationId: r.destination_id,
      destinationName: r.destination_name,
      destinationPosition: r.destination_position,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      category: r.category,
      description: r.description,
      mapUrl: r.map_url,
    });

    const existing = destMap.get(r.destination_id);
    if (existing) {
      existing.pinCount += 1;
    } else {
      destMap.set(r.destination_id, {
        id: r.destination_id,
        name: r.destination_name,
        position: r.destination_position,
        pinCount: 1,
      });
    }
  }

  const destinations = [...destMap.values()].sort(
    (a, b) => a.position - b.position,
  );

  return { pins, destinations };
});
