import "server-only";
import { sql, timestampToString } from "./db";
import type { PlanDocument } from "./types";

interface Row {
  id: string;
  plan_id: string;
  position: number;
  title: string;
  description: string;
  file_url: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, plan_id, position, title, description, file_url, created_at, updated_at
`;

function rowToDocument(r: Row): PlanDocument {
  return {
    id: r.id,
    planId: r.plan_id,
    position: r.position,
    title: r.title,
    description: r.description,
    fileUrl: r.file_url,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listPlanDocuments(
  planId: string
): Promise<PlanDocument[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM plan_documents WHERE plan_id = $1 ORDER BY position ASC, created_at ASC`,
    [planId]
  )) as Row[];
  return rows.map(rowToDocument);
}

export async function getPlanDocument(
  id: string
): Promise<PlanDocument | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM plan_documents WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToDocument(rows[0]) : null;
}

export interface PlanDocumentInput {
  title: string;
  description: string;
  fileUrl: string;
}

export async function createPlanDocument(
  planId: string,
  input: PlanDocumentInput
): Promise<PlanDocument> {
  const rows = (await sql().query(
    `
    INSERT INTO plan_documents (plan_id, position, title, description, file_url)
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM plan_documents WHERE plan_id = $1), 0),
      $2, $3, $4
    )
    RETURNING ${COLS}
    `,
    [planId, input.title.trim(), input.description, input.fileUrl.trim()]
  )) as Row[];
  return rowToDocument(rows[0]);
}

export async function updatePlanDocument(
  id: string,
  input: PlanDocumentInput
): Promise<PlanDocument | null> {
  const rows = (await sql().query(
    `
    UPDATE plan_documents SET
      title       = $2,
      description = $3,
      file_url    = $4,
      updated_at  = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [id, input.title.trim(), input.description, input.fileUrl.trim()]
  )) as Row[];
  return rows[0] ? rowToDocument(rows[0]) : null;
}

export async function deletePlanDocument(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM plan_documents WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
