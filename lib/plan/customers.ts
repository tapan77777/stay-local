import "server-only";
import { sql, timestampToString } from "./db";
import type { Customer } from "./types";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  created_at: unknown;
  updated_at: unknown;
}

function rowToCustomer(r: CustomerRow): Customer {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    whatsapp: r.whatsapp,
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

export async function listCustomers(): Promise<Customer[]> {
  const rows = (await sql()`
    SELECT id, name, email, whatsapp, created_at, updated_at
    FROM customers
    ORDER BY created_at DESC
  `) as CustomerRow[];
  return rows.map(rowToCustomer);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const rows = (await sql()`
    SELECT id, name, email, whatsapp, created_at, updated_at
    FROM customers
    WHERE id = ${id}
    LIMIT 1
  `) as CustomerRow[];
  return rows[0] ? rowToCustomer(rows[0]) : null;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  whatsapp: string;
}

export async function createCustomer(
  input: CreateCustomerInput
): Promise<Customer> {
  const rows = (await sql()`
    INSERT INTO customers (name, email, whatsapp)
    VALUES (
      ${input.name.trim()},
      ${input.email.trim().toLowerCase()},
      ${input.whatsapp.trim()}
    )
    RETURNING id, name, email, whatsapp, created_at, updated_at
  `) as CustomerRow[];
  return rowToCustomer(rows[0]);
}

export async function countCustomers(): Promise<number> {
  const rows = (await sql()`SELECT COUNT(*)::int AS n FROM customers`) as {
    n: number;
  }[];
  return rows[0]?.n ?? 0;
}
