import "server-only";
import { sql, newPrivateToken, dateToString, timestampToString } from "./db";
import type {
  Customer,
  Plan,
  PlanAccessResult,
  PlanStatus,
  PlanWithCustomer,
} from "./types";
import { PLAN_STATUSES } from "./types";

interface PlanRow {
  id: string;
  customer_id: string;
  private_token: string;
  title: string;
  subtitle: string;
  start_date: unknown;
  end_date: unknown;
  status: string;
  access_starts_at: unknown;
  access_ends_at: unknown;
  traveler_name: string;
  trip_days: number | null;
  travel_style: string;
  budget_style: string;
  special_preferences: string;
  important_notes: string;
  whatsapp_contact: string;
  support_info: string;
  created_at: unknown;
  updated_at: unknown;
}

interface JoinedPlanRow extends PlanRow {
  c_id: string | null;
  c_name: string | null;
  c_email: string | null;
  c_whatsapp: string | null;
  c_created_at: unknown;
  c_updated_at: unknown;
}

const PLAN_RETURNING = `
  id,
  customer_id,
  private_token,
  title,
  subtitle,
  start_date,
  end_date,
  status::text AS status,
  access_starts_at,
  access_ends_at,
  traveler_name,
  trip_days,
  travel_style,
  budget_style,
  special_preferences,
  important_notes,
  whatsapp_contact,
  support_info,
  created_at,
  updated_at
`;

/*
 * Shared join projection: every list/detail/token query returns the same
 * shape so UI code can rely on a single mapper. All columns are selected
 * explicitly — no SELECT *.
 */
const PLAN_JOIN_SQL = `
  SELECT
    p.id,
    p.customer_id,
    p.private_token,
    p.title,
    p.subtitle,
    p.start_date,
    p.end_date,
    p.status::text AS status,
    p.access_starts_at,
    p.access_ends_at,
    p.traveler_name,
    p.trip_days,
    p.travel_style,
    p.budget_style,
    p.special_preferences,
    p.important_notes,
    p.whatsapp_contact,
    p.support_info,
    p.created_at,
    p.updated_at,
    c.id         AS c_id,
    c.name       AS c_name,
    c.email      AS c_email,
    c.whatsapp   AS c_whatsapp,
    c.created_at AS c_created_at,
    c.updated_at AS c_updated_at
  FROM plans p
  LEFT JOIN customers c ON c.id = p.customer_id
`;

function rowToPlan(r: PlanRow): Plan {
  return {
    id: r.id,
    customerId: r.customer_id,
    privateToken: r.private_token,
    title: r.title,
    subtitle: r.subtitle,
    startDate: dateToString(r.start_date),
    endDate: dateToString(r.end_date),
    status: r.status as PlanStatus,
    accessStartsAt: timestampToString(r.access_starts_at),
    accessEndsAt: timestampToString(r.access_ends_at),
    travelerName: r.traveler_name ?? "",
    tripDays: r.trip_days ?? null,
    travelStyle: r.travel_style ?? "",
    budgetStyle: r.budget_style ?? "",
    specialPreferences: r.special_preferences ?? "",
    importantNotes: r.important_notes ?? "",
    whatsappContact: r.whatsapp_contact ?? "",
    supportInfo: r.support_info ?? "",
    createdAt: timestampToString(r.created_at) ?? "",
    updatedAt: timestampToString(r.updated_at) ?? "",
  };
}

function rowToPlanWithCustomer(r: JoinedPlanRow): PlanWithCustomer {
  const plan = rowToPlan(r);
  const customer: Customer | null = r.c_id
    ? {
        id: r.c_id,
        name: r.c_name ?? "",
        email: r.c_email ?? "",
        whatsapp: r.c_whatsapp ?? "",
        createdAt: timestampToString(r.c_created_at) ?? "",
        updatedAt: timestampToString(r.c_updated_at) ?? "",
      }
    : null;
  return { ...plan, customer };
}

function assertStatus(status: PlanStatus): PlanStatus {
  if (!(PLAN_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Invalid plan status: ${String(status)}`);
  }
  return status;
}

export interface ListPlansOptions {
  limit?: number;
}

export async function listPlans(
  options: ListPlansOptions = {}
): Promise<PlanWithCustomer[]> {
  const limit = options.limit ?? 500;
  const rows = (await sql().query(
    `${PLAN_JOIN_SQL} ORDER BY p.created_at DESC LIMIT $1`,
    [limit]
  )) as JoinedPlanRow[];
  return rows.map(rowToPlanWithCustomer);
}

export async function getPlan(id: string): Promise<PlanWithCustomer | null> {
  const rows = (await sql().query(
    `${PLAN_JOIN_SQL} WHERE p.id = $1 LIMIT 1`,
    [id]
  )) as JoinedPlanRow[];
  return rows[0] ? rowToPlanWithCustomer(rows[0]) : null;
}

export async function getPlanByToken(
  token: string
): Promise<PlanWithCustomer | null> {
  const rows = (await sql().query(
    `${PLAN_JOIN_SQL} WHERE p.private_token = $1 LIMIT 1`,
    [token]
  )) as JoinedPlanRow[];
  return rows[0] ? rowToPlanWithCustomer(rows[0]) : null;
}

export interface CreatePlanInput {
  customerId: string;
  title: string;
  subtitle: string;
  startDate: string | null;
  endDate: string | null;
  status: PlanStatus;
  accessStartsAt: string | null;
  accessEndsAt: string | null;
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const status = assertStatus(input.status);
  const rows = (await sql().query(
    `
    INSERT INTO plans (
      customer_id, private_token, title, subtitle,
      start_date, end_date, status,
      access_starts_at, access_ends_at
    )
    VALUES (
      $1, $2, $3, $4,
      $5::date, $6::date, $7::plan_status,
      $8::timestamptz, $9::timestamptz
    )
    RETURNING ${PLAN_RETURNING}
    `,
    [
      input.customerId,
      newPrivateToken(),
      input.title.trim(),
      input.subtitle.trim(),
      input.startDate,
      input.endDate,
      status,
      input.accessStartsAt,
      input.accessEndsAt,
    ]
  )) as PlanRow[];
  return rowToPlan(rows[0]);
}

export interface UpdatePlanInput {
  title: string;
  subtitle: string;
  startDate: string | null;
  endDate: string | null;
  status: PlanStatus;
  accessStartsAt: string | null;
  accessEndsAt: string | null;
}

/**
 * Full plan edit — used by the admin edit form which submits every field.
 * One statement, one round-trip, no read-then-write.
 */
export async function updatePlan(
  id: string,
  input: UpdatePlanInput
): Promise<Plan | null> {
  const status = assertStatus(input.status);
  const rows = (await sql().query(
    `
    UPDATE plans SET
      title            = $2,
      subtitle         = $3,
      start_date       = $4::date,
      end_date         = $5::date,
      status           = $6::plan_status,
      access_starts_at = $7::timestamptz,
      access_ends_at   = $8::timestamptz,
      updated_at       = now()
    WHERE id = $1
    RETURNING ${PLAN_RETURNING}
    `,
    [
      id,
      input.title.trim(),
      input.subtitle.trim(),
      input.startDate,
      input.endDate,
      status,
      input.accessStartsAt,
      input.accessEndsAt,
    ]
  )) as PlanRow[];
  return rows[0] ? rowToPlan(rows[0]) : null;
}

export interface UpdatePlanOverviewInput {
  travelerName: string;
  tripDays: number | null;
  travelStyle: string;
  budgetStyle: string;
  specialPreferences: string;
  importantNotes: string;
}

export async function updatePlanOverview(
  id: string,
  input: UpdatePlanOverviewInput
): Promise<Plan | null> {
  const rows = (await sql().query(
    `
    UPDATE plans SET
      traveler_name        = $2,
      trip_days            = $3,
      travel_style         = $4,
      budget_style         = $5,
      special_preferences  = $6,
      important_notes      = $7,
      updated_at           = now()
    WHERE id = $1
    RETURNING ${PLAN_RETURNING}
    `,
    [
      id,
      input.travelerName.trim(),
      input.tripDays,
      input.travelStyle.trim(),
      input.budgetStyle.trim(),
      input.specialPreferences.trim(),
      input.importantNotes.trim(),
    ]
  )) as PlanRow[];
  return rows[0] ? rowToPlan(rows[0]) : null;
}

export interface UpdatePlanHelpInput {
  whatsappContact: string;
  supportInfo: string;
}

export async function updatePlanHelp(
  id: string,
  input: UpdatePlanHelpInput
): Promise<Plan | null> {
  const rows = (await sql().query(
    `
    UPDATE plans SET
      whatsapp_contact = $2,
      support_info     = $3,
      updated_at       = now()
    WHERE id = $1
    RETURNING ${PLAN_RETURNING}
    `,
    [id, input.whatsappContact.trim(), input.supportInfo.trim()]
  )) as PlanRow[];
  return rows[0] ? rowToPlan(rows[0]) : null;
}

/**
 * Status-only toggle — used by the enable/disable action.
 * Avoids a second query: no need to fetch the row first.
 */
export async function setPlanStatus(
  id: string,
  status: PlanStatus
): Promise<Plan | null> {
  const safe = assertStatus(status);
  const rows = (await sql().query(
    `
    UPDATE plans SET
      status     = $2::plan_status,
      updated_at = now()
    WHERE id = $1
    RETURNING ${PLAN_RETURNING}
    `,
    [id, safe]
  )) as PlanRow[];
  return rows[0] ? rowToPlan(rows[0]) : null;
}

export async function rotatePrivateToken(id: string): Promise<Plan | null> {
  const rows = (await sql().query(
    `
    UPDATE plans SET
      private_token = $2,
      updated_at    = now()
    WHERE id = $1
    RETURNING ${PLAN_RETURNING}
    `,
    [id, newPrivateToken()]
  )) as PlanRow[];
  return rows[0] ? rowToPlan(rows[0]) : null;
}

/**
 * Toggles between DISABLED and DRAFT in one query. Avoids a read-then-write
 * round-trip. Returns the resulting status.
 */
export async function togglePlanDisabled(
  id: string
): Promise<Plan | null> {
  const rows = (await sql().query(
    `
    UPDATE plans SET
      status     = CASE WHEN status = 'DISABLED' THEN 'DRAFT' ELSE 'DISABLED' END::plan_status,
      updated_at = now()
    WHERE id = $1
    RETURNING ${PLAN_RETURNING}
    `,
    [id]
  )) as PlanRow[];
  return rows[0] ? rowToPlan(rows[0]) : null;
}

export function evaluatePlanAccess(
  plan: Plan,
  now = new Date()
): PlanAccessResult {
  if (plan.status === "DISABLED") return { ok: false, reason: "disabled" };
  if (plan.accessStartsAt) {
    const starts = new Date(plan.accessStartsAt);
    if (!Number.isNaN(starts.getTime()) && now < starts) {
      return { ok: false, reason: "not_yet" };
    }
  }
  if (plan.accessEndsAt) {
    const ends = new Date(plan.accessEndsAt);
    if (!Number.isNaN(ends.getTime()) && now > ends) {
      return { ok: false, reason: "expired" };
    }
  }
  return { ok: true };
}

export async function countPlans(): Promise<{
  total: number;
  byStatus: Record<PlanStatus, number>;
}> {
  const stats = await getDashboardStats();
  return stats.plans;
}

export interface DashboardStats {
  customers: number;
  plans: { total: number; byStatus: Record<PlanStatus, number> };
}

/**
 * Single round-trip for the admin dashboard counters.
 * One SQL statement, N scalar subqueries, zero waterfall.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = (await sql()`
    SELECT
      (SELECT COUNT(*)::int FROM customers)                        AS customers,
      (SELECT COUNT(*)::int FROM plans)                            AS total,
      (SELECT COUNT(*)::int FROM plans WHERE status = 'DRAFT')     AS draft,
      (SELECT COUNT(*)::int FROM plans WHERE status = 'PREPARING') AS preparing,
      (SELECT COUNT(*)::int FROM plans WHERE status = 'READY')     AS ready,
      (SELECT COUNT(*)::int FROM plans WHERE status = 'ACTIVE')    AS active,
      (SELECT COUNT(*)::int FROM plans WHERE status = 'COMPLETED') AS completed,
      (SELECT COUNT(*)::int FROM plans WHERE status = 'DISABLED')  AS disabled
  `) as {
    customers: number;
    total: number;
    draft: number;
    preparing: number;
    ready: number;
    active: number;
    completed: number;
    disabled: number;
  }[];
  const r = rows[0];
  return {
    customers: r?.customers ?? 0,
    plans: {
      total: r?.total ?? 0,
      byStatus: {
        DRAFT: r?.draft ?? 0,
        PREPARING: r?.preparing ?? 0,
        READY: r?.ready ?? 0,
        ACTIVE: r?.active ?? 0,
        COMPLETED: r?.completed ?? 0,
        DISABLED: r?.disabled ?? 0,
      },
    },
  };
}
