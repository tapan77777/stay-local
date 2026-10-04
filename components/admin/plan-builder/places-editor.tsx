"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlaceAction,
  deletePlaceAction,
  movePlaceAction,
  updatePlaceAction,
} from "@/lib/plan/actions-2a";
import {
  PLACE_PRIORITIES,
  PLACE_PRIORITY_LABEL,
  type Place,
} from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  places: Place[];
}

export function PlacesEditor({ planId, destinationId, places }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {places.length === 0
            ? "No places yet."
            : `${places.length} place${places.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add place"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <PlaceForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-3">
        {places.map((p, i) =>
          editingId === p.id ? (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <PlaceForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                place={p}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-base text-charcoal">
                      {p.name}
                    </span>
                    <span
                      className={
                        p.priority === "MUST_SEE"
                          ? "rounded-full bg-terracotta/15 px-2 py-0.5 text-[11px] text-terracotta"
                          : p.priority === "OPTIONAL"
                            ? "rounded-full bg-charcoal/[0.06] px-2 py-0.5 text-[11px] text-muted"
                            : "rounded-full bg-brand-green/15 px-2 py-0.5 text-[11px] text-brand-green-dark"
                      }
                    >
                      {PLACE_PRIORITY_LABEL[p.priority]}
                    </span>
                  </div>
                  {p.description ? (
                    <p className="mt-1 text-sm text-charcoal">
                      {p.description}
                    </p>
                  ) : null}
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
                    {p.duration ? (
                      <div>
                        <dt className="inline">Duration: </dt>
                        <dd className="inline text-charcoal">{p.duration}</dd>
                      </div>
                    ) : null}
                    {p.bestTime ? (
                      <div>
                        <dt className="inline">Best time: </dt>
                        <dd className="inline text-charcoal">{p.bestTime}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {p.whyVisit ? (
                    <p className="mt-2 text-xs italic text-muted">
                      Why: {p.whyVisit}
                    </p>
                  ) : null}
                  {p.tapanNote ? (
                    <p className="mt-1 text-xs text-brand-green-dark">
                      Tapan: {p.tapanNote}
                    </p>
                  ) : null}
                  {p.warning ? (
                    <p className="mt-1 text-xs text-terracotta">
                      Warning: {p.warning}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await movePlaceAction(
                        planId,
                        destinationId,
                        p.id,
                        direction
                      );
                    }}
                    isFirst={i === 0}
                    isLast={i === places.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(p.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deletePlaceAction(planId, destinationId, p.id);
                    }}
                  />
                </div>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function PlaceForm({
  planId,
  destinationId,
  mode,
  place,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  place?: Place;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createPlaceAction.bind(null, planId, destinationId)
      : updatePlaceAction.bind(null, planId, destinationId, place!.id);
  const [state, formAction, pending] = useActionState(
    async (prev: { error: string } | null, fd: FormData) => {
      const result = await bound(prev, fd);
      if (!result && onDone) onDone();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,auto]">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={place?.name ?? ""}
            placeholder="e.g. Humayun's Tomb"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={place?.priority ?? "RECOMMENDED"}
            className="flex h-11 rounded-lg border border-border bg-white px-3 text-sm text-charcoal focus:border-brand-green focus:outline-none"
          >
            {PLACE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PLACE_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Short description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={place?.description ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="whyVisit">Why worth visiting</Label>
        <Textarea
          id="whyVisit"
          name="whyVisit"
          rows={2}
          defaultValue={place?.whyVisit ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="duration">Recommended duration</Label>
          <Input
            id="duration"
            name="duration"
            defaultValue={place?.duration ?? ""}
            placeholder="e.g. 1–2 hours"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bestTime">Best time</Label>
          <Input
            id="bestTime"
            name="bestTime"
            defaultValue={place?.bestTime ?? ""}
            placeholder="e.g. Sunrise, Friday evenings"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mapUrl">Google Maps URL</Label>
          <Input
            id="mapUrl"
            name="mapUrl"
            defaultValue={place?.mapUrl ?? ""}
            placeholder="https://maps.google.com/…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            defaultValue={place?.imageUrl ?? ""}
            placeholder="https://…"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tapanNote">Tapan&rsquo;s note</Label>
        <Textarea
          id="tapanNote"
          name="tapanNote"
          rows={2}
          defaultValue={place?.tapanNote ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="warning">Warning (optional)</Label>
        <Input
          id="warning"
          name="warning"
          defaultValue={place?.warning ?? ""}
          placeholder="e.g. Closed on Mondays"
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add place" : "Save"}
        </Button>
      </div>
    </form>
  );
}
