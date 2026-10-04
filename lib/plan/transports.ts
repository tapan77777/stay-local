import "server-only";
import { sql, timestampToString } from "./db";
import {
  TRANSPORT_TYPES,
  type Transport,
  type TransportType,
} from "./types";

interface Row {
  id: string;
  destination_id: string;
  position: number;
  transport_type: string;
  from_location: string;
  to_location: string;
  duration: string;
  instructions: string;
  booking_info: string;
  price_guidance: string;
  tapan_note: string;
  warning: string;
  created_at: unknown;
  updated_at: unknown;
}

const COLS = `
  id, destination_id, position,
  transport_type::text AS transport_type,
  from_location, to_location, duration, instructions,
  booking_info, price_guidance, tapan_note, warning,
  created_at, updated_at
`;

function assertType(t: string): TransportType {
  return (TRANSPORT_TYPES as readonly string[]).includes(t)
    ? (t as TransportType)
    : "OTHER";
}

function rowToTransport(r: Row): Transport {
  return {
    id: r.id,
    destinationId: r.destination_id,
    position: r.position,
    transportType: assertType(r.transport_type),
    fromLocation: r.from_location,
    toLocation: r.to_location,
    duration: r.duration,
    instructions: r.instructions,
    bookingInfo: r.booking_info,
    priceGuidance: r.price_guidance,
    tapanNote: r.tapan_note,
    warning: r.warning,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listTransports(
  destinationId: string
): Promise<Transport[]> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM transports WHERE destination_id = $1 ORDER BY position ASC, created_at ASC`,
    [destinationId]
  )) as Row[];
  return rows.map(rowToTransport);
}

export async function getTransport(id: string): Promise<Transport | null> {
  const rows = (await sql().query(
    `SELECT ${COLS} FROM transports WHERE id = $1 LIMIT 1`,
    [id]
  )) as Row[];
  return rows[0] ? rowToTransport(rows[0]) : null;
}

export interface TransportInput {
  transportType: TransportType;
  fromLocation: string;
  toLocation: string;
  duration: string;
  instructions: string;
  bookingInfo: string;
  priceGuidance: string;
  tapanNote: string;
  warning: string;
}

export async function createTransport(
  destinationId: string,
  input: TransportInput
): Promise<Transport> {
  const rows = (await sql().query(
    `
    INSERT INTO transports (
      destination_id, position, transport_type,
      from_location, to_location, duration, instructions,
      booking_info, price_guidance, tapan_note, warning
    )
    VALUES (
      $1,
      COALESCE((SELECT MAX(position) + 1 FROM transports WHERE destination_id = $1), 0),
      $2::transport_type, $3, $4, $5, $6, $7, $8, $9, $10
    )
    RETURNING ${COLS}
    `,
    [
      destinationId,
      assertType(input.transportType),
      input.fromLocation.trim(),
      input.toLocation.trim(),
      input.duration.trim(),
      input.instructions,
      input.bookingInfo,
      input.priceGuidance.trim(),
      input.tapanNote,
      input.warning,
    ]
  )) as Row[];
  return rowToTransport(rows[0]);
}

export async function updateTransport(
  id: string,
  input: TransportInput
): Promise<Transport | null> {
  const rows = (await sql().query(
    `
    UPDATE transports SET
      transport_type = $2::transport_type,
      from_location  = $3,
      to_location    = $4,
      duration       = $5,
      instructions   = $6,
      booking_info   = $7,
      price_guidance = $8,
      tapan_note     = $9,
      warning        = $10,
      updated_at     = now()
    WHERE id = $1
    RETURNING ${COLS}
    `,
    [
      id,
      assertType(input.transportType),
      input.fromLocation.trim(),
      input.toLocation.trim(),
      input.duration.trim(),
      input.instructions,
      input.bookingInfo,
      input.priceGuidance.trim(),
      input.tapanNote,
      input.warning,
    ]
  )) as Row[];
  return rows[0] ? rowToTransport(rows[0]) : null;
}

export async function deleteTransport(id: string): Promise<boolean> {
  const rows = (await sql().query(
    `DELETE FROM transports WHERE id = $1 RETURNING id`,
    [id]
  )) as { id: string }[];
  return rows.length > 0;
}
