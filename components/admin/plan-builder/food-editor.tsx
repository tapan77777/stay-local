"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createFoodAction,
  deleteFoodAction,
  moveFoodAction,
  updateFoodAction,
} from "@/lib/plan/actions-2a";
import type { Food } from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  items: Food[];
}

export function FoodEditor({ planId, destinationId, items }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {items.length === 0
            ? "No food recs yet."
            : `${items.length} food recommendation${items.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add food"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <FoodForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((f, i) =>
          editingId === f.id ? (
            <li
              key={f.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <FoodForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                item={f}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={f.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-base text-charcoal">
                      {f.name}
                    </span>
                    {f.category ? (
                      <span className="rounded-full bg-saffron/15 px-2 py-0.5 text-[11px] text-charcoal">
                        {f.category}
                      </span>
                    ) : null}
                    {f.priceCategory ? (
                      <span className="text-xs text-muted">
                        {f.priceCategory}
                      </span>
                    ) : null}
                  </div>
                  {f.location ? (
                    <p className="mt-0.5 text-xs text-muted">{f.location}</p>
                  ) : null}
                  {f.whatToTry ? (
                    <p className="mt-1 text-sm text-charcoal">
                      Try: {f.whatToTry}
                    </p>
                  ) : null}
                  {f.whyRecommended ? (
                    <p className="mt-1 text-xs italic text-muted">
                      {f.whyRecommended}
                    </p>
                  ) : null}
                  {f.tapanNote ? (
                    <p className="mt-1 text-xs text-brand-green-dark">
                      Tapan: {f.tapanNote}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await moveFoodAction(
                        planId,
                        destinationId,
                        f.id,
                        direction
                      );
                    }}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(f.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteFoodAction(planId, destinationId, f.id);
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

function FoodForm({
  planId,
  destinationId,
  mode,
  item,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  item?: Food;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createFoodAction.bind(null, planId, destinationId)
      : updateFoodAction.bind(null, planId, destinationId, item!.id);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="category">Type / category</Label>
          <Input
            id="category"
            name="category"
            defaultValue={item?.category ?? ""}
            placeholder="restaurant, street food, cafe"
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
        <div className="space-y-1.5">
          <Label htmlFor="priceCategory">Price</Label>
          <Input
            id="priceCategory"
            name="priceCategory"
            defaultValue={item?.priceCategory ?? ""}
            placeholder="$ / $$ / $$$"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="whatToTry">What to try</Label>
        <Textarea
          id="whatToTry"
          name="whatToTry"
          rows={2}
          defaultValue={item?.whatToTry ?? ""}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mapUrl">Google Maps URL</Label>
          <Input
            id="mapUrl"
            name="mapUrl"
            defaultValue={item?.mapUrl ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            defaultValue={item?.imageUrl ?? ""}
          />
        </div>
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
          {pending ? "Saving…" : mode === "create" ? "Add food" : "Save"}
        </Button>
      </div>
    </form>
  );
}
