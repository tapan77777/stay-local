import "server-only";
import { sql, timestampToString } from "./db";
import { NOTE_TYPES, type DestinationNote, type NoteType } from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  title: string;
  note: string;
  note_type: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position, title, note,
  note_type::text AS note_type, created_at, updated_at
`;

function assertType(t: string): NoteType {
  return (NOTE_TYPES as readonly string[]).includes(t)
    ? (t as NoteType)
    : "MY_TAKE";
}

function rowToNote(r: Row): DestinationNote {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    title: r.title,
    note: r.note,
    noteType: assertType(r.note_type),
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listDestinationNotes(
  destinationId: string
): Promise<DestinationNote[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM destination_notes WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToNote);
}

export async function getDestinationNote(
  id: string
): Promise<DestinationNote | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM destination_notes WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToNote(rows[0]) : null;
}

export interface DestinationNoteInput {
  title: string;
  note: string;
  noteType: NoteType;
}

export async function createDestinationNote(
  destinationId: string,
  input: DestinationNoteInput
): Promise<DestinationNote> {
  const rows = (await sql().query(
    `
    INSERT INTO destination_notes (
      destination_id, position, title, note, note_type
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM destination_notes WHERE destination_id = $1), 0),
      $2, $3, $4::note_type
    )
    RETURNING ${COLS}
    `,
    [destinationId, input.title.trim(), input.note, assertType(input.noteType)]
  )) as Row[];
  return rowToNote(rows[0]);
}

export async function updateDestinationNote(
  id: string,
  input: DestinationNoteInput
): Promise<DestinationNote | null> {
  const rows = (await sql().query(
    `
    UPDATE destination_notes SET
      title      = $2,
      note       = $3,
      note_type  = $4::note_type,
      updated_at = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [id, input.title.trim(), input.note, assertType(input.noteType)]
  )) as Row[];
  return rows[0] ? rowToNote(rows[0]) : null;
}

export async function deleteDestinationNote(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM destination_notes WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
