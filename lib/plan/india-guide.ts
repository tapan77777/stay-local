import "server-only";
import { sql, timestampToString } from "./db";
import {
  GUIDE_CATEGORIES,
  type GuideCategory,
  type IndiaGuideItem,
} from "./types";

interface Row {
  id: string;
  plan_id: string;
  position: number;
  category: string;
  title: string;
  content: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, plan_id, position, category::text AS category, title, content,
  created_at, updated_at
`;

function assertCategory(c: string): GuideCategory {
  return (GUIDE_CATEGORIES as readonly string[]).includes(c)
    ? (c as GuideCategory)
    : "PRACTICAL";
}

function rowToItem(r: Row): IndiaGuideItem {
  return {
    id: r.id,
    planId: r.plan_id,
    position: r.position,
    category: assertCategory(r.category),
    title: r.title,
    content: r.content,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listIndiaGuideItems(
  planId: string
): Promise<IndiaGuideItem[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM india_guide_items WHERE plan_id = $1 ORDER BY position ASC, created_at ASC`,
    [planId]
  )) as Row[];
  return rows.map(rowToItem);
}

export async function getIndiaGuideItem(
  id: string
): Promise<IndiaGuideItem | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM india_guide_items WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToItem(rows[0]) : null;
}

export interface IndiaGuideItemInput {
  category: GuideCategory;
  title: string;
  content: string;
}

export async function createIndiaGuideItem(
  planId: string,
  input: IndiaGuideItemInput
): Promise<IndiaGuideItem> {
  const rows = (await sql().query(
    `
    INSERT INTO india_guide_items (plan_id, position, category, title, content)
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM india_guide_items WHERE plan_id = $1), 0),
      $2::guide_category, $3, $4
    )
    RETURNING ${COLS}
    `,
    [planId, assertCategory(input.category), input.title.trim(), input.content]
  )) as Row[];
  return rowToItem(rows[0]);
}

export async function updateIndiaGuideItem(
  id: string,
  input: IndiaGuideItemInput
): Promise<IndiaGuideItem | null> {
  const rows = (await sql().query(
    `
    UPDATE india_guide_items SET
      category   = $2::guide_category,
      title      = $3,
      content    = $4,
      updated_at = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [id, assertCategory(input.category), input.title.trim(), input.content]
  )) as Row[];
  return rows[0] ? rowToItem(rows[0]) : null;
}

export async function deleteIndiaGuideItem(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM india_guide_items WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
