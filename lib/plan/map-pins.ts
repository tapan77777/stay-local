import "server-only";
import { sql, timestampToString } from "./db";
import { PIN_CATEGORIES, type MapPin, type PinCategory } from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  description: string;
  map_url: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position, name, latitude, longitude,
  category::text AS category, description, map_url, created_at, updated_at
`;

function assertCategory(c: string): PinCategory {
  return (PIN_CATEGORIES as readonly string[]).includes(c)
    ? (c as PinCategory)
    : "OTHER";
}

function rowToPin(r: Row): MapPin {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    category: assertCategory(r.category),
    description: r.description,
    mapUrl: r.map_url,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listMapPins(destinationId: string): Promise<MapPin[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM map_pins WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToPin);
}

export async function getMapPin(id: string): Promise<MapPin | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM map_pins WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToPin(rows[0]) : null;
}

export interface MapPinInput {
  name: string;
  latitude: number | null;
  longitude: number | null;
  category: PinCategory;
  description: string;
  mapUrl: string;
}

export async function createMapPin(
  destinationId: string,
  input: MapPinInput
): Promise<MapPin> {
  const rows = (await sql().query(
    `
    INSERT INTO map_pins (
      destination_id, position, name, latitude, longitude,
      category, description, map_url
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM map_pins WHERE destination_id = $1), 0),
      $2, $3, $4, $5::pin_category, $6, $7
    )
    RETURNING ${COLS}
    `,
    [
      destinationId,
      input.name.trim(),
      input.latitude,
      input.longitude,
      assertCategory(input.category),
      input.description,
      input.mapUrl.trim(),
    ]
  )) as Row[];
  return rowToPin(rows[0]);
}

export async function updateMapPin(
  id: string,
  input: MapPinInput
): Promise<MapPin | null> {
  const rows = (await sql().query(
    `
    UPDATE map_pins SET
      name        = $2,
      latitude    = $3,
      longitude   = $4,
      category    = $5::pin_category,
      description = $6,
      map_url     = $7,
      updated_at  = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [
      id,
      input.name.trim(),
      input.latitude,
      input.longitude,
      assertCategory(input.category),
      input.description,
      input.mapUrl.trim(),
    ]
  )) as Row[];
  return rows[0] ? rowToPin(rows[0]) : null;
}

export async function deleteMapPin(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM map_pins WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
