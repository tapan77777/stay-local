"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createStayAction,
  deleteStayAction,
  moveStayAction,
  updateStayAction,
} from "@/lib/plan/actions-2a";
import type { Stay } from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  items: Stay[];
}

export function StaysEditor({ planId, destinationId, items }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {items.length === 0
            ? "No stays yet."
            : `${items.length} stay${items.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add stay"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <StayForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((s, i) =>
          editingId === s.id ? (
            <li
              key={s.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <StayForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                stay={s}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={s.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-base text-charcoal">
                      {s.name}
                    </span>
                    {s.stayType ? (
                      <span className="rounded-full bg-charcoal/[0.06] px-2 py-0.5 text-[11px] text-muted">
                        {s.stayType}
                      </span>
                    ) : null}
                    {s.priceCategory ? (
                      <span className="text-xs text-muted">
                        {s.priceCategory}
                      </span>
                    ) : null}
                  </div>
                  {s.area ? (
                    <p className="mt-0.5 text-xs text-muted">{s.area}</p>
                  ) : null}
                  {s.whyRecommended ? (
                    <p className="mt-1 text-sm text-charcoal">
                      {s.whyRecommended}
                    </p>
                  ) : null}
                  {s.tapanNote ? (
                    <p className="mt-1 text-xs text-brand-green-dark">
                      Tapan: {s.tapanNote}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {s.bookingUrl ? (
                      <a
                        href={s.bookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-green hover:underline"
                      >
                        Book ↗
                      </a>
                    ) : null}
                    {s.mapUrl ? (
                      <a
                        href={s.mapUrl}
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
                      await moveStayAction(
                        planId,
                        destinationId,
                        s.id,
                        direction
                      );
                    }}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(s.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteStayAction(planId, destinationId, s.id);
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

function StayForm({
  planId,
  destinationId,
  mode,
  stay,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  stay?: Stay;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createStayAction.bind(null, planId, destinationId)
      : updateStayAction.bind(null, planId, destinationId, stay!.id);
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
        <Input id="name" name="name" required defaultValue={stay?.name ?? ""} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="area">Area / location</Label>
          <Input id="area" name="area" defaultValue={stay?.area ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stayType">Type</Label>
          <Input
            id="stayType"
            name="stayType"
            defaultValue={stay?.stayType ?? ""}
            placeholder="hotel, homestay, …"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priceCategory">Price category</Label>
          <Input
            id="priceCategory"
            name="priceCategory"
            defaultValue={stay?.priceCategory ?? ""}
            placeholder="$ / $$ / $$$"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="whyRecommended">Why StayLocal recommends it</Label>
        <Textarea
          id="whyRecommended"
          name="whyRecommended"
          rows={2}
          defaultValue={stay?.whyRecommended ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mapUrl">Google Maps URL</Label>
          <Input
            id="mapUrl"
            name="mapUrl"
            defaultValue={stay?.mapUrl ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bookingUrl">Booking URL</Label>
          <Input
            id="bookingUrl"
            name="bookingUrl"
            defaultValue={stay?.bookingUrl ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          defaultValue={stay?.imageUrl ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tapanNote">Tapan&rsquo;s note</Label>
        <Textarea
          id="tapanNote"
          name="tapanNote"
          rows={2}
          defaultValue={stay?.tapanNote ?? ""}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add stay" : "Save"}
        </Button>
      </div>
    </form>
  );
}
