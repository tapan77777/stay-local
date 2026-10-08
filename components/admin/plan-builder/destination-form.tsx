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
import {
  MODULE_KEYS,
  MODULE_LABEL,
  type Destination,
  type ModuleKey,
} from "@/lib/plan/types";
import { ImageUrlField } from "./image-url-field";
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
        <p className="text-[11px] leading-snug text-muted">
          Used as the Journey hero and as the fallback artwork for any
          module card without its own image.
        </p>
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

      <fieldset className="space-y-3 rounded-xl border border-border bg-charcoal/[0.02] p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Module card images (optional)
        </legend>
        <p className="-mt-2 text-[11.5px] leading-snug text-muted">
          Each row below sets the artwork for the matching module card on
          the Journey page. Leave blank to fall back to the destination
          hero. Use the same hosts allowed in <code>next.config.ts</code>.
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {(MODULE_KEYS as readonly ModuleKey[]).map((k) => (
            <ImageUrlField
              key={k}
              name={`moduleImageUrl_${k}`}
              label={`${MODULE_LABEL[k]} card`}
              defaultValue={destination?.moduleImageUrls?.[k] ?? ""}
            />
          ))}
        </div>
      </fieldset>

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
