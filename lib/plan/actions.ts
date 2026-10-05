"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminConfigured,
  requireAdmin,
  verifyAdminPassword,
} from "./auth";
import { createCustomer } from "./customers";
import {
  createPlan,
  getPlanByToken,
  rotatePrivateToken,
  togglePlanDisabled,
  updatePlan,
  updatePlanMaxDevices,
  evaluatePlanAccess,
} from "./plans";
import {
  applyAuthorizeOutcomeToCookieJar,
  authorizeDeviceAtomic,
  deviceCookieName,
  revokeAllDevices,
  revokeDevice,
} from "./devices";
import { headers, cookies } from "next/headers";
import { createPlanSession } from "./plan-access";
import {
  MAX_MAX_DEVICES,
  MIN_MAX_DEVICES,
  PLAN_STATUSES,
  type PlanStatus,
} from "./types";

interface ActionError {
  error: string;
}

export async function loginAction(
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  if (!isAdminConfigured()) {
    return {
      error:
        "Admin is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in your environment.",
    };
  }
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Please enter the admin password." };
  const ok = await verifyAdminPassword(password);
  if (!ok) return { error: "That password is incorrect." };
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function createCustomerAction(
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  await createCustomer({ name, email, whatsapp });
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

function parseStatus(value: FormDataEntryValue | null): PlanStatus {
  const v = String(value ?? "");
  return (PLAN_STATUSES as readonly string[]).includes(v)
    ? (v as PlanStatus)
    : "DRAFT";
}

function parseDate(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : v;
}

export async function createPlanAction(
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const customerId = String(formData.get("customerId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  if (!customerId) return { error: "Please choose a customer." };
  if (!title) return { error: "Please enter a plan title." };
  const plan = await createPlan({
    customerId,
    title,
    subtitle,
    startDate: parseDate(formData.get("startDate")),
    endDate: parseDate(formData.get("endDate")),
    status: parseStatus(formData.get("status")),
    accessStartsAt: parseDate(formData.get("accessStartsAt")),
    accessEndsAt: parseDate(formData.get("accessEndsAt")),
  });
  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  redirect(`/admin/plans/${plan.id}`);
}

export async function updatePlanAction(
  planId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Please enter a plan title." };
  const updated = await updatePlan(planId, {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    startDate: parseDate(formData.get("startDate")),
    endDate: parseDate(formData.get("endDate")),
    status: parseStatus(formData.get("status")),
    accessStartsAt: parseDate(formData.get("accessStartsAt")),
    accessEndsAt: parseDate(formData.get("accessEndsAt")),
  });
  if (!updated) return { error: "Plan not found." };
  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${planId}`);
  return null;
}

export async function togglePlanDisabledAction(planId: string): Promise<void> {
  await requireAdmin();
  await togglePlanDisabled(planId);
  revalidatePath("/admin");
  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${planId}`);
}

export async function rotatePlanTokenAction(planId: string): Promise<void> {
  await requireAdmin();
  await rotatePrivateToken(planId);
  revalidatePath(`/admin/plans/${planId}`);
}

export async function updateMaxDevicesAction(
  planId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const raw = String(formData.get("maxDevices") ?? "").trim();
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return { error: "Please enter a valid number." };
  }
  const value = Math.floor(n);
  if (value < MIN_MAX_DEVICES || value > MAX_MAX_DEVICES) {
    return {
      error: `Please pick a number between ${MIN_MAX_DEVICES} and ${MAX_MAX_DEVICES}.`,
    };
  }
  const updated = await updatePlanMaxDevices(planId, value);
  if (!updated) return { error: "Plan not found." };
  revalidatePath(`/admin/plans/${planId}`);
  revalidatePath("/admin/plans");
  return null;
}

export async function revokeDeviceAction(
  planId: string,
  deviceId: string
): Promise<void> {
  await requireAdmin();
  await revokeDevice(deviceId, planId);
  revalidatePath(`/admin/plans/${planId}`);
  revalidatePath("/admin/plans");
}

export async function revokeAllDevicesAction(planId: string): Promise<void> {
  await requireAdmin();
  await revokeAllDevices(planId);
  revalidatePath(`/admin/plans/${planId}`);
  revalidatePath("/admin/plans");
}

export async function unlockPlanAction(
  token: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!name) return { error: "Please enter your name." };
  if (!code) return { error: "Please enter your access code." };

  // Token in URL must match code the customer typed.
  if (code !== token) {
    return { error: "That access code doesn't match this link." };
  }

  const plan = await getPlanByToken(token);
  if (!plan) {
    return { error: "Your StayLocal plan isn't available right now." };
  }
  const access = evaluatePlanAccess(plan);
  if (!access.ok) {
    return { error: "Your StayLocal plan isn't available right now." };
  }
  await createPlanSession(plan.id, name);

  // Register this device as part of the unlock. Server Actions are a
  // legal cookie-mutation context, so we can set the device cookie here
  // atomically with the session cookie — meaning the very next render
  // of /plan/<token> has both cookies in place and skips the bootstrap
  // Route Handler entirely.
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const jar = await cookies();
  const existingDeviceCookie = jar.get(deviceCookieName(plan.id))?.value ?? null;
  const outcome = await authorizeDeviceAtomic(plan.id, existingDeviceCookie, ua);
  await applyAuthorizeOutcomeToCookieJar(plan.id, outcome);

  revalidatePath(`/plan/${token}`);
  return null;
}
