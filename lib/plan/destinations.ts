import "server-only";
import { sql, dateToString, timestampToString } from "./db";
import type {
  Destination,
  DestinationModuleCounts,
  ModuleKey,
} from "./types";

interface DestinationRow {
  id: string;
  plan_id: string;
  position: number;
  name: string;
  intro: string;
  arrival_date: unknown;
  departure_date: unknown;
  nights: number | null;
  hero_image_url: string;
  tapan_intro: string;
  itinerary_image_url: string;
  places_image_url: string;
  food_image_url: string;
  transport_image_url: string;
  stays_image_url: string;
  experiences_image_url: string;
  map_image_url: string;
  notes_image_url: string;
  created_at: unknown;
  updated_at: unknown;
}

const DESTINATION_COLUMNS = `
  id,
  plan_id,
  position,
  name,
  intro,
  arrival_date,
  departure_date,
  nights,
  hero_image_url,
  tapan_intro,
  itinerary_image_url,
  places_image_url,
  food_image_url,
  transport_image_url,
  stays_image_url,
  experiences_image_url,
  map_image_url,
  notes_image_url,
  created_at,
  updated_at
`;

function rowToDestination(r: DestinationRow): Destination {
  const moduleImageUrls: Record<ModuleKey, string> = {
    itinerary: r.itinerary_image_url ?? "",
    places: r.places_image_url ?? "",
    food: r.food_image_url ?? "",
    transport: r.transport_image_url ?? "",
    stays: r.stays_image_url ?? "",
    experiences: r.experiences_image_url ?? "",
    map: r.map_image_url ?? "",
    notes: r.notes_image_url ?? "",
  };
  return {
    id: r.id,
    planId: r.plan_id,
    position: r.position,
    name: r.name,
    intro: r.intro,
    arrivalDate: dateToString(r.arrival_date),
    departureDate: dateToString(r.departure_date),
    nights: r.nights,
    heroImageUrl: r.hero_image_url,
    tapanIntro: r.tapan_intro,
    moduleImageUrls,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listDestinations(
  planId: string
): Promise<Destination[]> {
  const rows = (await sql().query(
    `SELECT ${DESTINATION_COLUMNS} FROM destinations WHERE plan_id = $1 ORDER BY position ASC, created_at ASC`,
    [planId]
  )) as DestinationRow[];
  return rows.map(rowToDestination);
}

export async function getDestination(id: string): Promise<Destination | null> {
  const rows = (await sql().query(
    `SELECT ${DESTINATION_COLUMNS} FROM destinations WHERE id = $1 LIMIT 1`,
    [id]
  )) as DestinationRow[];
  return rows[0] ? rowToDestination(rows[0]) : null;
}

export interface CreateDestinationInput {
  planId: string;
  name: string;
  intro: string;
  arrivalDate: string | null;
  departureDate: string | null;
  nights: number | null;
  heroImageUrl: string;
  tapanIntro: string;
  moduleImageUrls: Record<ModuleKey, string>;
}

export async function createDestination(
  input: CreateDestinationInput
): Promise<Destination> {
  const m = input.moduleImageUrls;
  const rows = (await sql().query(
    `
    INSERT INTO destinations (
      plan_id, position, name, intro, arrival_date, departure_date,
      nights, hero_image_url, tapan_intro,
      itinerary_image_url, places_image_url, food_image_url,
      transport_image_url, stays_image_url, experiences_image_url,
      map_image_url, notes_image_url
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM destinations WHERE plan_id = $1), 0),
      $2, $3, $4::date, $5::date, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15, $16
    )
    RETURNING ${DESTINATION_COLUMNS}
    `,
    [
      input.planId,
      input.name.trim(),
      input.intro.trim(),
      input.arrivalDate,
      input.departureDate,
      input.nights,
      input.heroImageUrl.trim(),
      input.tapanIntro.trim(),
      m.itinerary.trim(),
      m.places.trim(),
      m.food.trim(),
      m.transport.trim(),
      m.stays.trim(),
      m.experiences.trim(),
      m.map.trim(),
      m.notes.trim(),
    ]
  )) as DestinationRow[];
  return rowToDestination(rows[0]);
}

export interface UpdateDestinationInput {
  name: string;
  intro: string;
  arrivalDate: string | null;
  departureDate: string | null;
  nights: number | null;
  heroImageUrl: string;
  tapanIntro: string;
  moduleImageUrls: Record<ModuleKey, string>;
}

export async function updateDestination(
  id: string,
  input: UpdateDestinationInput
): Promise<Destination | null> {
  const m = input.moduleImageUrls;
  const rows = (await sql().query(
    `
    UPDATE destinations SET
      name                   = $2,
      intro                  = $3,
      arrival_date           = $4::date,
      departure_date         = $5::date,
      nights                 = $6,
      hero_image_url         = $7,
      tapan_intro            = $8,
      itinerary_image_url    = $9,
      places_image_url       = $10,
      food_image_url         = $11,
      transport_image_url    = $12,
      stays_image_url        = $13,
      experiences_image_url  = $14,
      map_image_url          = $15,
      notes_image_url        = $16,
      updated_at             = now()
    WHERE id = $1
    RETURNING ${DESTINATION_COLUMNS}
    `,
    [
      id,
      input.name.trim(),
      input.intro.trim(),
      input.arrivalDate,
      input.departureDate,
      input.nights,
      input.heroImageUrl.trim(),
      input.tapanIntro.trim(),
      m.itinerary.trim(),
      m.places.trim(),
      m.food.trim(),
      m.transport.trim(),
      m.stays.trim(),
      m.experiences.trim(),
      m.map.trim(),
      m.notes.trim(),
    ]
  )) as DestinationRow[];
  return rows[0] ? rowToDestination(rows[0]) : null;
}

export async function deleteDestination(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM destinations WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}

/**
 * Returns module counts for every destination in a plan in one round-trip.
 * Used by the admin plan builder to show "{N} items" next to each module.
 */
export async function listDestinationModuleCounts(
  planId: string
): Promise<Map<string, DestinationModuleCounts>> {
  const rows = (await sql().query(
    `
    SELECT
      d.id AS destination_id,
      (SELECT COUNT(*)::int FROM itinerary_days     WHERE destination_id = d.id) AS itinerary,
      (SELECT COUNT(*)::int FROM places             WHERE destination_id = d.id) AS places,
      (SELECT COUNT(*)::int FROM transports         WHERE destination_id = d.id) AS transport,
      (SELECT COUNT(*)::int FROM stays              WHERE destination_id = d.id) AS stays,
      (SELECT COUNT(*)::int FROM foods              WHERE destination_id = d.id) AS food,
      (SELECT COUNT(*)::int FROM experiences        WHERE destination_id = d.id) AS experiences,
      (SELECT COUNT(*)::int FROM map_pins           WHERE destination_id = d.id) AS map,
      (SELECT COUNT(*)::int FROM destination_notes  WHERE destination_id = d.id) AS notes
    FROM destinations d
    WHERE d.plan_id = $1
    `,
    [planId]
  )) as (DestinationModuleCounts & { destination_id: string })[];
  const result = new Map<string, DestinationModuleCounts>();
  for (const r of rows) {
    result.set(r.destination_id, {
      itinerary: r.itinerary,
      places: r.places,
      transport: r.transport,
      stays: r.stays,
      food: r.food,
      experiences: r.experiences,
      map: r.map,
      notes: r.notes,
    });
  }
  return result;
}

export async function getDestinationModuleCounts(
  destinationId: string
): Promise<DestinationModuleCounts> {
  const rows = (await sql().query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM itinerary_days     WHERE destination_id = $1) AS itinerary,
      (SELECT COUNT(*)::int FROM places             WHERE destination_id = $1) AS places,
      (SELECT COUNT(*)::int FROM transports         WHERE destination_id = $1) AS transport,
      (SELECT COUNT(*)::int FROM stays              WHERE destination_id = $1) AS stays,
      (SELECT COUNT(*)::int FROM foods              WHERE destination_id = $1) AS food,
      (SELECT COUNT(*)::int FROM experiences        WHERE destination_id = $1) AS experiences,
      (SELECT COUNT(*)::int FROM map_pins           WHERE destination_id = $1) AS map,
      (SELECT COUNT(*)::int FROM destination_notes  WHERE destination_id = $1) AS notes
    `,
    [destinationId]
  )) as DestinationModuleCounts[];
  return rows[0] ?? {
    itinerary: 0,
    places: 0,
    transport: 0,
    stays: 0,
    food: 0,
    experiences: 0,
    map: 0,
    notes: 0,
  };
}
