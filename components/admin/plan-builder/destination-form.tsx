"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDestinationAction,
  updateDestinationAction,
} from "@/lib/plan/actions-2a";
import { toDateInputValue } from "@/lib/plan/format";
import type { Destination } from "@/lib/plan/types";
import { SaveState } from "./save-state";

type Mode = "create" | "edit";

interface Props {
  planId: string;
  mode: Mode;
  destination?: Destination;
  onDone?: () => void;
}

export function DestinationForm({ planId, mode, destination }: Props) {
  const action =
    mode === "create"
      ? createDestinationAction.bind(null, planId)
      : updateDestinationAction.bind(null, planId, destination!.id);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Destination name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={destination?.name ?? ""}
          placeholder="e.g. Delhi"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="intro">Short introduction</Label>
        <Textarea
          id="intro"
          name="intro"
          defaultValue={destination?.intro ?? ""}
          placeholder="One-line context for the traveler"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="arrivalDate">Arrival</Label>
          <Input
            id="arrivalDate"
            name="arrivalDate"
            type="date"
            defaultValue={toDateInputValue(destination?.arrivalDate)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="departureDate">Departure</Label>
          <Input
            id="departureDate"
            name="departureDate"
            type="date"
            defaultValue={toDateInputValue(destination?.departureDate)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nights">Nights</Label>
          <Input
            id="nights"
            name="nights"
            type="number"
            min={0}
            defaultValue={destination?.nights ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="heroImageUrl">Hero image URL (optional)</Label>
        <Input
          id="heroImageUrl"
          name="heroImageUrl"
          defaultValue={destination?.heroImageUrl ?? ""}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tapanIntro">Tapan&rsquo;s personal introduction</Label>
        <Textarea
          id="tapanIntro"
          name="tapanIntro"
          defaultValue={destination?.tapanIntro ?? ""}
          placeholder="A warm, personal note from you about this place"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add destination"
              : "Save destination"}
        </Button>
      </div>
    </form>
  );
}
