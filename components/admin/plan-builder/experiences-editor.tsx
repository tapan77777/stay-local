"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createExperienceAction,
  deleteExperienceAction,
  moveExperienceAction,
  updateExperienceAction,
} from "@/lib/plan/actions-2a";
import type { Experience } from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  items: Experience[];
}

export function ExperiencesEditor({ planId, destinationId, items }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {items.length === 0
            ? "No experiences yet."
            : `${items.length} experience${items.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add experience"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <ExperienceForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((e, i) =>
          editingId === e.id ? (
            <li
              key={e.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <ExperienceForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                item={e}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={e.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-base text-charcoal">
                      {e.name}
                    </span>
                    {e.duration ? (
                      <span className="text-xs text-muted">
                        {e.duration}
                      </span>
                    ) : null}
                    {e.price ? (
                      <span className="text-xs text-muted">· {e.price}</span>
                    ) : null}
                  </div>
                  {e.location ? (
                    <p className="mt-0.5 text-xs text-muted">{e.location}</p>
                  ) : null}
                  {e.description ? (
                    <p className="mt-1 text-sm text-charcoal">
                      {e.description}
                    </p>
                  ) : null}
                  {e.whyRecommended ? (
                    <p className="mt-1 text-xs italic text-muted">
                      Why: {e.whyRecommended}
                    </p>
                  ) : null}
                  {e.tapanNote ? (
                    <p className="mt-1 text-xs text-brand-green-dark">
                      Tapan: {e.tapanNote}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {e.bookingUrl ? (
                      <a
                        href={e.bookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-green hover:underline"
                      >
                        Book ↗
                      </a>
                    ) : null}
                    {e.mapUrl ? (
                      <a
                        href={e.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-green hover:underline"
                      >
                        Map ↗
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await moveExperienceAction(
                        planId,
                        destinationId,
                        e.id,
                        direction
                      );
                    }}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(e.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteExperienceAction(
                        planId,
                        destinationId,
                        e.id
                      );
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

function ExperienceForm({
  planId,
  destinationId,
  mode,
  item,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  item?: Experience;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createExperienceAction.bind(null, planId, destinationId)
      : updateExperienceAction.bind(null, planId, destinationId, item!.id);
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
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={item?.name ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={item?.description ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="whyRecommended">Why recommended</Label>
        <Textarea
          id="whyRecommended"
          name="whyRecommended"
          rows={2}
          defaultValue={item?.whyRecommended ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            name="duration"
            defaultValue={item?.duration ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Approx. price</Label>
          <Input
            id="price"
            name="price"
            defaultValue={item?.price ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={item?.location ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bookingUrl">Booking URL</Label>
          <Input
            id="bookingUrl"
            name="bookingUrl"
            defaultValue={item?.bookingUrl ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mapUrl">Google Maps URL</Label>
          <Input
            id="mapUrl"
            name="mapUrl"
            defaultValue={item?.mapUrl ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          defaultValue={item?.imageUrl ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tapanNote">Tapan&rsquo;s note</Label>
        <Textarea
          id="tapanNote"
          name="tapanNote"
          rows={2}
          defaultValue={item?.tapanNote ?? ""}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add experience" : "Save"}
        </Button>
      </div>
    </form>
  );
}
