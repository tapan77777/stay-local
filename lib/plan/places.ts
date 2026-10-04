import "server-only";
import { sql, timestampToString } from "./db";
import { PLACE_PRIORITIES, type Place, type PlacePriority } from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  name: string;
  description: string;
  why_visit: string;
  duration: string;
  best_time: string;
  priority: string;
  map_url: string;
  image_url: string;
  tapan_note: string;
  warning: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position, name, description, why_visit,
  duration, best_time, priority::text AS priority,
  map_url, image_url, tapan_note, warning, created_at, updated_at
`;

function assertPriority(p: string): PlacePriority {
  return (PLACE_PRIORITIES as readonly string[]).includes(p)
    ? (p as PlacePriority)
    : "RECOMMENDED";
}

function rowToPlace(r: Row): Place {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    name: r.name,
    description: r.description,
    whyVisit: r.why_visit,
    duration: r.duration,
    bestTime: r.best_time,
    priority: assertPriority(r.priority),
    mapUrl: r.map_url,
    imageUrl: r.image_url,
    tapanNote: r.tapan_note,
    warning: r.warning,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listPlaces(destinationId: string): Promise<Place[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM places WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToPlace);
}

export async function getPlace(id: string): Promise<Place | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM places WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToPlace(rows[0]) : null;
}

export interface PlaceInput {
  name: string;
  description: string;
  whyVisit: string;
  duration: string;
  bestTime: string;
  priority: PlacePriority;
  mapUrl: string;
  imageUrl: string;
  tapanNote: string;
  warning: string;
}

export async function createPlace(
  destinationId: string,
  input: PlaceInput
): Promise<Place> {
  const rows = (await sql().query(
    `
    INSERT INTO places (
      destination_id, position, name, description, why_visit, duration,
      best_time, priority, map_url, image_url, tapan_note, warning
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM places WHERE destination_id = $1), 0),
      $2, $3, $4, $5, $6, $7::place_priority, $8, $9, $10, $11
    )
    RETURNING ${COLS}
    `,
    [
      destinationId,
      input.name.trim(),
      input.description,
      input.whyVisit,
      input.duration.trim(),
      input.bestTime.trim(),
      assertPriority(input.priority),
      input.mapUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
      input.warning,
    ]
  )) as Row[];
  return rowToPlace(rows[0]);
}

export async function updatePlace(
  id: string,
  input: PlaceInput
): Promise<Place | null> {
  const rows = (await sql().query(
    `
    UPDATE places SET
      name        = $2,
      description = $3,
      why_visit   = $4,
      duration    = $5,
      best_time   = $6,
      priority    = $7::place_priority,
      map_url     = $8,
      image_url   = $9,
      tapan_note  = $10,
      warning     = $11,
      updated_at  = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [
      id,
      input.name.trim(),
      input.description,
      input.whyVisit,
      input.duration.trim(),
      input.bestTime.trim(),
      assertPriority(input.priority),
      input.mapUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
      input.warning,
    ]
  )) as Row[];
  return rows[0] ? rowToPlace(rows[0]) : null;
}

export async function deletePlace(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM places WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
