"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveState } from "./plan-builder/save-state";
import {
  revokeAllDevicesAction,
  revokeDeviceAction,
  updateMaxDevicesAction,
} from "@/lib/plan/actions";
import {
  MAX_MAX_DEVICES,
  MIN_MAX_DEVICES,
  type Plan,
  type PlanDevice,
} from "@/lib/plan/types";

/*
 * Admin "Access" panel. One form for max_devices, a list of registered
 * devices with per-device revoke, and a destructive "revoke all" button.
 *
 * Notes we deliberately DO NOT render:
 *   • Raw device tokens / hashes (never sent to the client).
 *   • Raw IP addresses or UA strings.
 *   • Full timestamps the admin can't act on — we show relative "last
 *     active" instead, so the table reads quickly.
 */

const activeCountOf = (devices: PlanDevice[]) =>
  devices.filter((d) => !d.revokedAt).length;

export function PlanDevicesPanel({
  plan,
  devices,
}: {
  plan: Plan;
  devices: PlanDevice[];
}) {
  const active = activeCountOf(devices);
  const overLimit = active > plan.maxDevices;
  return (
    <div className="rounded-2xl border border-border bg-white p-6 text-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-lg text-charcoal">Access</h2>
        <AccessChip
          active={active}
          max={plan.maxDevices}
          overLimit={overLimit}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        Limits how many devices can open this plan at the same time.
      </p>

      <div className="mt-5 border-t border-border pt-5">
        <MaxDevicesForm plan={plan} />
      </div>

      {overLimit ? (
        <p className="mt-4 rounded-md bg-terracotta/10 px-3 py-2 text-xs text-terracotta">
          {active} devices currently registered, but the limit is now{" "}
          {plan.maxDevices}. Existing devices still work — revoke devices
          below to bring the count down.
        </p>
      ) : null}

      <div className="mt-6 border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Devices
          </h3>
          <span className="text-xs text-muted">
            {active} / {plan.maxDevices} in use
          </span>
        </div>

        {devices.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-4 text-xs text-muted">
            No devices have opened this plan yet.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
            {devices.map((d) => (
              <DeviceRow key={d.id} planId={plan.id} device={d} />
            ))}
          </ul>
        )}

        {active > 0 ? (
          <RevokeAllForm planId={plan.id} />
        ) : null}
      </div>
    </div>
  );
}

function AccessChip({
  active,
  max,
  overLimit,
}: {
  active: number;
  max: number;
  overLimit: boolean;
}) {
  if (overLimit) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-2.5 py-1 text-[11px] font-medium text-terracotta">
        {active} / {max}
      </span>
    );
  }
  if (active >= max) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-warm px-2.5 py-1 text-[11px] font-medium text-charcoal-soft">
        {active} / {max}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-2.5 py-1 text-[11px] font-medium text-brand-green-dark">
      {active} / {max}
    </span>
  );
}

function MaxDevicesForm({ plan }: { plan: Plan }) {
  const action = updateMaxDevicesAction.bind(null, plan.id);
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="maxDevices">Maximum devices</Label>
        <Input
          id="maxDevices"
          name="maxDevices"
          type="number"
          min={MIN_MAX_DEVICES}
          max={MAX_MAX_DEVICES}
          defaultValue={plan.maxDevices}
          className="w-24 text-center font-mono text-sm"
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function DeviceRow({
  planId,
  device,
}: {
  planId: string;
  device: PlanDevice;
}) {
  const revoke = revokeDeviceAction.bind(null, planId, device.id);
  const revoked = Boolean(device.revokedAt);
  const label = device.deviceLabel || "Browser";
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={
              "h-1.5 w-1.5 shrink-0 rounded-full " +
              (revoked ? "bg-muted" : "bg-brand-green")
            }
          />
          <p className="truncate text-[13.5px] font-medium text-charcoal">
            {label}
          </p>
          <span
            className={
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] " +
              (revoked
                ? "bg-cream-warm text-muted"
                : "bg-brand-green/10 text-brand-green-dark")
            }
          >
            {revoked ? "Revoked" : "Active"}
          </span>
        </div>
        <p className="mt-0.5 text-[11.5px] text-muted">
          {revoked ? (
            <>Revoked {formatRelativeTime(device.revokedAt)}</>
          ) : (
            <>Last active {formatRelativeTime(device.lastSeenAt)}</>
          )}
          {" · "}
          First seen {formatRelativeTime(device.firstSeenAt)}
        </p>
      </div>
      {revoked ? null : (
        <form action={revoke}>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="text-terracotta"
          >
            Revoke
          </Button>
        </form>
      )}
    </li>
  );
}

function RevokeAllForm({ planId }: { planId: string }) {
  const action = revokeAllDevicesAction.bind(null, planId);
  return (
    <form
      action={action}
      className="mt-4 flex items-center justify-end"
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Revoke all currently registered devices? Every active device will have to re-authenticate."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="border-terracotta/40 text-terracotta hover:border-terracotta hover:bg-terracotta/5"
      >
        Revoke all devices
      </Button>
    </form>
  );
}

// Compact "N min ago" formatter so the admin table stays scannable. Not
// cryptographically precise — just human friendly. "Never" if we somehow
// got passed an empty string.
function formatRelativeTime(iso: string | null): string {
  if (!iso) return "never";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "never";
  const diff = Date.now() - t;
  const abs = Math.abs(diff);
  const past = diff >= 0;
  const sec = Math.round(abs / 1000);
  if (sec < 60) return past ? "just now" : "in a few seconds";
  const min = Math.round(sec / 60);
  if (min < 60) return `${past ? "" : "in "}${min} min${min === 1 ? "" : "s"}${past ? " ago" : ""}`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${past ? "" : "in "}${hr} hour${hr === 1 ? "" : "s"}${past ? " ago" : ""}`;
  const days = Math.round(hr / 24);
  if (days < 60) return `${past ? "" : "in "}${days} day${days === 1 ? "" : "s"}${past ? " ago" : ""}`;
  const months = Math.round(days / 30);
  return `${past ? "" : "in "}${months} month${months === 1 ? "" : "s"}${past ? " ago" : ""}`;
}
