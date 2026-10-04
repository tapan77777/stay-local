"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateHelpAction } from "@/lib/plan/actions-2a";
import type { Plan } from "@/lib/plan/types";
import { SaveState } from "./save-state";

export function HelpForm({ plan }: { plan: Plan }) {
  const action = updateHelpAction.bind(null, plan.id);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="whatsappContact">WhatsApp contact</Label>
        <Input
          id="whatsappContact"
          name="whatsappContact"
          defaultValue={plan.whatsappContact}
          placeholder="e.g. +91 98765 43210"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="supportInfo">Support info</Label>
        <Textarea
          id="supportInfo"
          name="supportInfo"
          defaultValue={plan.supportInfo}
          placeholder="How to reach StayLocal, useful numbers, support hours…"
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save help"}
        </Button>
      </div>
    </form>
  );
}
