import "server-only";
import { sql, timestampToString } from "./db";
import type { Experience } from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  name: string;
  description: string;
  why_recommended: string;
  duration: string;
  price: string;
  location: string;
  booking_url: string;
  map_url: string;
  image_url: string;
  tapan_note: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position, name, description, why_recommended,
  duration, price, location, booking_url, map_url, image_url, tapan_note,
  created_at, updated_at
`;

function rowToExperience(r: Row): Experience {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    name: r.name,
    description: r.description,
    whyRecommended: r.why_recommended,
    duration: r.duration,
    price: r.price,
    location: r.location,
    bookingUrl: r.booking_url,
    mapUrl: r.map_url,
    imageUrl: r.image_url,
    tapanNote: r.tapan_note,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listExperiences(
  destinationId: string
): Promise<Experience[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM experiences WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToExperience);
}

export async function getExperience(id: string): Promise<Experience | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM experiences WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToExperience(rows[0]) : null;
}

export interface ExperienceInput {
  name: string;
  description: string;
  whyRecommended: string;
  duration: string;
  price: string;
  location: string;
  bookingUrl: string;
  mapUrl: string;
  imageUrl: string;
  tapanNote: string;
}

export async function createExperience(
  destinationId: string,
  input: ExperienceInput
): Promise<Experience> {
  const rows = (await sql().query(
    `
    INSERT INTO experiences (
      destination_id, position, name, description, why_recommended,
      duration, price, location, booking_url, map_url, image_url, tapan_note
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM experiences WHERE destination_id = $1), 0),
      $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    )
    RETURNING ${COLS}
    `,
    [
      destinationId,
      input.name.trim(),
      input.description,
      input.whyRecommended,
      input.duration.trim(),
      input.price.trim(),
      input.location.trim(),
      input.bookingUrl.trim(),
      input.mapUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
    ]
  )) as Row[];
  return rowToExperience(rows[0]);
}

export async function updateExperience(
  id: string,
  input: ExperienceInput
): Promise<Experience | null> {
  const rows = (await sql().query(
    `
    UPDATE experiences SET
      name            = $2,
      description     = $3,
      why_recommended = $4,
      duration        = $5,
      price           = $6,
      location        = $7,
      booking_url     = $8,
      map_url         = $9,
      image_url       = $10,
      tapan_note      = $11,
      updated_at      = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [
      id,
      input.name.trim(),
      input.description,
      input.whyRecommended,
      input.duration.trim(),
      input.price.trim(),
      input.location.trim(),
      input.bookingUrl.trim(),
      input.mapUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
    ]
  )) as Row[];
  return rows[0] ? rowToExperience(rows[0]) : null;
}

export async function deleteExperience(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM experiences WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
