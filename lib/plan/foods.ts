import "server-only";
import { sql, timestampToString } from "./db";
import type { Food } from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  name: string;
  category: string;
  what_to_try: string;
  location: string;
  why_recommended: string;
  price_category: string;
  map_url: string;
  image_url: string;
  tapan_note: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position, name, category, what_to_try, location,
  why_recommended, price_category, map_url, image_url, tapan_note,
  created_at, updated_at
`;

function rowToFood(r: Row): Food {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    name: r.name,
    category: r.category,
    whatToTry: r.what_to_try,
    location: r.location,
    whyRecommended: r.why_recommended,
    priceCategory: r.price_category,
    mapUrl: r.map_url,
    imageUrl: r.image_url,
    tapanNote: r.tapan_note,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listFoods(destinationId: string): Promise<Food[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM foods WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToFood);
}

export async function getFood(id: string): Promise<Food | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM foods WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToFood(rows[0]) : null;
}

export interface FoodInput {
  name: string;
  category: string;
  whatToTry: string;
  location: string;
  whyRecommended: string;
  priceCategory: string;
  mapUrl: string;
  imageUrl: string;
  tapanNote: string;
}

export async function createFood(
  destinationId: string,
  input: FoodInput
): Promise<Food> {
  const rows = (await sql().query(
    `
    INSERT INTO foods (
      destination_id, position, name, category, what_to_try, location,
      why_recommended, price_category, map_url, image_url, tapan_note
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM foods WHERE destination_id = $1), 0),
      $2, $3, $4, $5, $6, $7, $8, $9, $10
    )
    RETURNING ${COLS}
    `,
    [
      destinationId,
      input.name.trim(),
      input.category.trim(),
      input.whatToTry,
      input.location.trim(),
      input.whyRecommended,
      input.priceCategory.trim(),
      input.mapUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
    ]
  )) as Row[];
  return rowToFood(rows[0]);
}

export async function updateFood(
  id: string,
  input: FoodInput
): Promise<Food | null> {
  const rows = (await sql().query(
    `
    UPDATE foods SET
      name            = $2,
      category        = $3,
      what_to_try     = $4,
      location        = $5,
      why_recommended = $6,
      price_category  = $7,
      map_url         = $8,
      image_url       = $9,
      tapan_note      = $10,
      updated_at      = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [
      id,
      input.name.trim(),
      input.category.trim(),
      input.whatToTry,
      input.location.trim(),
      input.whyRecommended,
      input.priceCategory.trim(),
      input.mapUrl.trim(),
      input.imageUrl.trim(),
      input.tapanNote,
    ]
  )) as Row[];
  return rows[0] ? rowToFood(rows[0]) : null;
}

export async function deleteFood(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM foods WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
