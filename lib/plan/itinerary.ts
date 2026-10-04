import "server-only";
import { sql, dateToString, timestampToString } from "./db";
import type { ItineraryDay } from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  day_label: string;
  day_date: unknown;
  morning: string;
  afternoon: string;
  evening: string;
  notes: string;
  recommended_timing: string;
  optional_items: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position, day_label, day_date,
  morning, afternoon, evening, notes, recommended_timing, optional_items,
  created_at, updated_at
`;

function rowToDay(r: Row): ItineraryDay {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    dayLabel: r.day_label,
    dayDate: dateToString(r.day_date),
    morning: r.morning,
    afternoon: r.afternoon,
    evening: r.evening,
    notes: r.notes,
    recommendedTiming: r.recommended_timing,
    optionalItems: r.optional_items,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listItineraryDays(
  destinationId: string
): Promise<ItineraryDay[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM itinerary_days WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToDay);
}

export async function getItineraryDay(id: string): Promise<ItineraryDay | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM itinerary_days WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToDay(rows[0]) : null;
}

export interface ItineraryDayInput {
  dayLabel: string;
  dayDate: string | null;
  morning: string;
  afternoon: string;
  evening: string;
  notes: string;
  recommendedTiming: string;
  optionalItems: string;
}

export async function createItineraryDay(
  destinationId: string,
  input: ItineraryDayInput
): Promise<ItineraryDay> {
  const rows = (await sql().query(
    `
    INSERT INTO itinerary_days (
      destination_id, position, day_label, day_date,
      morning, afternoon, evening, notes, recommended_timing, optional_items
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM itinerary_days WHERE destination_id = $1), 0),
      $2, $3::date, $4, $5, $6, $7, $8, $9
    )
    RETURNING ${COLS}
    `,
    [
      destinationId,
      input.dayLabel.trim(),
      input.dayDate,
      input.morning,
      input.afternoon,
      input.evening,
      input.notes,
      input.recommendedTiming,
      input.optionalItems,
    ]
  )) as Row[];
  return rowToDay(rows[0]);
}

export async function updateItineraryDay(
  id: string,
  input: ItineraryDayInput
): Promise<ItineraryDay | null> {
  const rows = (await sql().query(
    `
    UPDATE itinerary_days SET
      day_label           = $2,
      day_date            = $3::date,
      morning             = $4,
      afternoon           = $5,
      evening             = $6,
      notes               = $7,
      recommended_timing  = $8,
      optional_items      = $9,
      updated_at          = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [
      id,
      input.dayLabel.trim(),
      input.dayDate,
      input.morning,
      input.afternoon,
      input.evening,
      input.notes,
      input.recommendedTiming,
      input.optionalItems,
    ]
  )) as Row[];
  return rows[0] ? rowToDay(rows[0]) : null;
}

export async function deleteItineraryDay(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM itinerary_days WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
