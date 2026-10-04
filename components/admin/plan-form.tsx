"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPlanAction,
  updatePlanAction,
} from "@/lib/plan/actions";
import { toDateInputValue } from "@/lib/plan/format";
import {
  PLAN_STATUSES,
  PLAN_STATUS_LABEL,
  type Customer,
  type Plan,
  type PlanStatus,
} from "@/lib/plan/types";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  customers: Customer[];
  plan?: Plan;
}

export function PlanForm({ mode, customers, plan }: Props) {
  const action =
    mode === "create"
      ? createPlanAction
      : updatePlanAction.bind(null, plan!.id);

  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5">
      {mode === "create" ? (
        <div className="space-y-1.5">
          <Label htmlFor="customerId">Customer</Label>
          <select
            id="customerId"
            name="customerId"
            required
            defaultValue=""
            className="flex h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          >
            <option value="" disabled>
              Select a customer…
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Trip title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={plan?.title ?? ""}
          placeholder="e.g. Rajasthan Discovery"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subtitle">Subtitle (optional)</Label>
        <Input
          id="subtitle"
          name="subtitle"
          defaultValue={plan?.subtitle ?? ""}
          placeholder="e.g. 12 days — Delhi to Udaipur"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Trip start</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(plan?.startDate)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Trip end</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInputValue(plan?.endDate)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={plan?.status ?? ("DRAFT" satisfies PlanStatus)}
          className="flex h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
        >
          {PLAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PLAN_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="accessStartsAt">Access starts</Label>
          <Input
            id="accessStartsAt"
            name="accessStartsAt"
            type="date"
            defaultValue={toDateInputValue(plan?.accessStartsAt)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accessEndsAt">Access ends</Label>
          <Input
            id="accessEndsAt"
            name="accessEndsAt"
            type="date"
            defaultValue={toDateInputValue(plan?.accessEndsAt)}
          />
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-md bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create plan"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
