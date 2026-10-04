"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOverviewAction } from "@/lib/plan/actions-2a";
import type { Plan } from "@/lib/plan/types";
import { SaveState } from "./save-state";

export function OverviewForm({ plan }: { plan: Plan }) {
  const action = updateOverviewAction.bind(null, plan.id);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="travelerName">Traveler name</Label>
          <Input
            id="travelerName"
            name="travelerName"
            defaultValue={plan.travelerName}
            placeholder="Who is this plan for?"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tripDays">Trip length (days)</Label>
          <Input
            id="tripDays"
            name="tripDays"
            type="number"
            min={1}
            defaultValue={plan.tripDays ?? ""}
            placeholder="e.g. 18"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="travelStyle">Travel style</Label>
          <Input
            id="travelStyle"
            name="travelStyle"
            defaultValue={plan.travelStyle}
            placeholder="e.g. Slow, cultural, boutique"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budgetStyle">Budget style</Label>
          <Input
            id="budgetStyle"
            name="budgetStyle"
            defaultValue={plan.budgetStyle}
            placeholder="e.g. Comfort / mid-range"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialPreferences">Special preferences</Label>
        <Textarea
          id="specialPreferences"
          name="specialPreferences"
          defaultValue={plan.specialPreferences}
          placeholder="Dietary needs, interests, dislikes, pace…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="importantNotes">Important traveler notes</Label>
        <Textarea
          id="importantNotes"
          name="importantNotes"
          defaultValue={plan.importantNotes}
          placeholder="Anything crucial for StayLocal to remember"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save overview"}
        </Button>
      </div>
    </form>
  );
}
