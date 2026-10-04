import "server-only";
import { sql, timestampToString } from "./db";
import type { Stay } from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  name: string;
  area: string;
  stay_type: string;
  price_category: string;
  why_recommended: string;
  map_url: string;
  booking_url: string;
  image_url: string;
  tapan_note: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position, name, area, stay_type, price_category,
  why_recommended, map_url, booking_url, image_url, tapan_note,
  created_at, updated_at
`;

function rowToStay(r: Row): Stay {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    name: r.name,
    area: r.area,
    stayType: r.stay_type,
    priceCategory: r.price_category,
    whyRecommended: r.why_recommended,
    mapUrl: r.map_url,
    bookingUrl: r.booking_url,
    imageUrl: r.image_url,
    tapanNote: r.tapan_note,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listStays(destinationId: string): Promise<Stay[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM stays WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToStay);
}

export async function getStay(id: string): Promise<Stay | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM stays WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToStay(rows[0]) : null;
}

export interface StayInput {
  name: string;
  area: string;
  stayType: string;
  priceCategory: string;
  whyRecommended: string;
  mapUrl: string;
  bookingUrl: string;
  imageUrl: string;
  tapanNote: string;
}

export async function createStay(
  destinationId: string,
  input: StayInput
): Promise<Stay> {
  const rows = (await sql().query(
    `
    INSERT INTO stays (
      destination_id, position, name, area, stay_type, price_category,
      why_recommended, map_url, booking_url, image_url, tapan_note
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM stays WHERE destination_id = $1), 0),
      $2, $3, $4, $5, $6, $7, $8, $9, $10
    )
    RETURNING ${COLS}
    `,
    [
      destinationId,
      input.name.trim(),
      input.area.trim(),
      input.stayType.trim(),
      input.priceCategory.trim(),
      input.whyRecommended,
      input.mapUrl.trim(),
      input.bookingUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
    ]
  )) as Row[];
  return rowToStay(rows[0]);
}

export async function updateStay(
  id: string,
  input: StayInput
): Promise<Stay | null> {
  const rows = (await sql().query(
    `
    UPDATE stays SET
      name            = $2,
      area            = $3,
      stay_type       = $4,
      price_category  = $5,
      why_recommended = $6,
      map_url         = $7,
      booking_url     = $8,
      image_url       = $9,
      tapan_note      = $10,
      updated_at      = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [
      id,
      input.name.trim(),
      input.area.trim(),
      input.stayType.trim(),
      input.priceCategory.trim(),
      input.whyRecommended,
      input.mapUrl.trim(),
      input.bookingUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
    ]
  )) as Row[];
  return rows[0] ? rowToStay(rows[0]) : null;
}

export async function deleteStay(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM stays WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
