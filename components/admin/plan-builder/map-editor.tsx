"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createMapPinAction,
  deleteMapPinAction,
  moveMapPinAction,
  updateMapPinAction,
} from "@/lib/plan/actions-2a";
import {
  PIN_CATEGORIES,
  PIN_CATEGORY_LABEL,
  type MapPin,
} from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  pins: MapPin[];
}

export function MapEditor({ planId, destinationId, pins }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {pins.length === 0
            ? "No map pins yet. The interactive map UI comes later; add pin data now."
            : `${pins.length} pin${pins.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add pin"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <PinForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-2">
        {pins.map((p, i) =>
          editingId === p.id ? (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <PinForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                pin={p}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={p.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] text-brand-green-dark">
                    {PIN_CATEGORY_LABEL[p.category]}
                  </span>
                  <span className="font-serif text-sm text-charcoal">
                    {p.name}
                  </span>
                </div>
                {(p.latitude != null || p.longitude != null) && (
                  <p className="mt-0.5 text-[11px] text-muted">
                    {p.latitude ?? "—"}, {p.longitude ?? "—"}
                  </p>
                )}
                {p.description ? (
                  <p className="mt-1 text-sm text-charcoal">{p.description}</p>
                ) : null}
                {p.mapUrl ? (
                  <a
                    href={p.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-brand-green hover:underline"
                  >
                    Open map ↗
                  </a>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <ReorderButtons
                  onMove={async (direction) => {
                    await moveMapPinAction(
                      planId,
                      destinationId,
                      p.id,
                      direction
                    );
                  }}
                  isFirst={i === 0}
                  isLast={i === pins.length - 1}
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
                    await deleteMapPinAction(planId, destinationId, p.id);
                  }}
                />
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function PinForm({
  planId,
  destinationId,
  mode,
  pin,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  pin?: MapPin;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createMapPinAction.bind(null, planId, destinationId)
      : updateMapPinAction.bind(null, planId, destinationId, pin!.id);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto,1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={pin?.category ?? "PLACE"}
            className="flex h-11 rounded-lg border border-border bg-white px-3 text-sm text-charcoal focus:border-brand-green focus:outline-none"
          >
            {PIN_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PIN_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={pin?.name ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={pin?.latitude ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={pin?.longitude ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Short description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={pin?.description ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mapUrl">Google Maps URL</Label>
        <Input
          id="mapUrl"
          name="mapUrl"
          defaultValue={pin?.mapUrl ?? ""}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add pin" : "Save"}
        </Button>
      </div>
    </form>
  );
}
