import "server-only";
import { sql } from "./db";

/**
 * Swap `position` with the nearest neighbor in the same group.
 * One round-trip. Table/column names are controlled by the server
 * (never user input) so inlining them is safe.
 *
 * Returns true when a swap happened, false when the item is already
 * at the edge (no neighbor to swap with).
 */
export async function swapPosition(
  tableName: string,
  groupColumn: string,
  id: string,
  direction: "up" | "down"
): Promise<boolean> {
  const comparator = direction === "up" ? "<" : ">";
  const order = direction === "up" ? "DESC" : "ASC";
  const rows = (await sql().query(
    `
    WITH cur AS (
      SELECT id, ${groupColumn} AS group_id, position
      FROM ${tableName} WHERE id = $1
    ),
    neighbor AS (
      SELECT t.id, t.position
      FROM ${tableName} t, cur
      WHERE t.${groupColumn} = cur.group_id
        AND t.position ${comparator} cur.position
      ORDER BY t.position ${order}
      LIMIT 1
    )
    UPDATE ${tableName} SET
      position   = CASE
        WHEN id = (SELECT id FROM cur)      THEN (SELECT position FROM neighbor)
        WHEN id = (SELECT id FROM neighbor) THEN (SELECT position FROM cur)
      END,
      updated_at = now()
    WHERE id IN (SELECT id FROM cur UNION ALL SELECT id FROM neighbor)
      AND EXISTS (SELECT 1 FROM neighbor)
    RETURNING id
    `,
    [id]
  )) as { id: string }[];
  return rows.length === 2;
}
