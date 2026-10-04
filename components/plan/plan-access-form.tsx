"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockPlanAction } from "@/lib/plan/actions";

export function PlanAccessForm({ token }: { token: string }) {
  const action = unlockPlanAction.bind(null, token);
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="font-serif text-xl text-charcoal">
            Your StayLocal Plan
          </div>
          <div className="mt-1 text-xs uppercase tracking-wider text-muted">
            Private access
          </div>
        </div>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Access code</Label>
            <Input
              id="code"
              name="code"
              required
              defaultValue={token}
              autoComplete="off"
              className="font-mono text-xs"
            />
          </div>
          {state?.error ? (
            <div className="rounded-md bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {state.error}
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Opening…" : "Open my plan"}
          </Button>
        </form>
      </div>
    </div>
  );
}
