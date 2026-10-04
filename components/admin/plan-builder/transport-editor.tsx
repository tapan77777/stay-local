"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createTransportAction,
  deleteTransportAction,
  moveTransportAction,
  updateTransportAction,
} from "@/lib/plan/actions-2a";
import {
  TRANSPORT_TYPES,
  TRANSPORT_TYPE_LABEL,
  type Transport,
} from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  items: Transport[];
}

export function TransportEditor({ planId, destinationId, items }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {items.length === 0
            ? "No transport yet."
            : `${items.length} transport option${items.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add transport"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <TransportForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((t, i) =>
          editingId === t.id ? (
            <li
              key={t.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <TransportForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                item={t}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={t.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-saffron/20 px-2 py-0.5 text-[11px] text-charcoal">
                      {TRANSPORT_TYPE_LABEL[t.transportType]}
                    </span>
                    <span className="font-serif text-sm text-charcoal">
                      {t.fromLocation || "—"}
                      {" → "}
                      {t.toLocation || "—"}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
                    {t.duration ? (
                      <div>
                        <dt className="inline">Duration: </dt>
                        <dd className="inline text-charcoal">{t.duration}</dd>
                      </div>
                    ) : null}
                    {t.priceGuidance ? (
                      <div>
                        <dt className="inline">Price: </dt>
                        <dd className="inline text-charcoal">
                          {t.priceGuidance}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {t.instructions ? (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-charcoal">
                      {t.instructions}
                    </p>
                  ) : null}
                  {t.bookingInfo ? (
                    <p className="mt-1 text-xs text-muted">
                      Booking: {t.bookingInfo}
                    </p>
                  ) : null}
                  {t.tapanNote ? (
                    <p className="mt-1 text-xs text-brand-green-dark">
                      Tapan: {t.tapanNote}
                    </p>
                  ) : null}
                  {t.warning ? (
                    <p className="mt-1 text-xs text-terracotta">
                      Warning: {t.warning}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await moveTransportAction(
                        planId,
                        destinationId,
                        t.id,
                        direction
                      );
                    }}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(t.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteTransportAction(
                        planId,
                        destinationId,
                        t.id
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

function TransportForm({
  planId,
  destinationId,
  mode,
  item,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  item?: Transport;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createTransportAction.bind(null, planId, destinationId)
      : updateTransportAction.bind(null, planId, destinationId, item!.id);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto,1fr,1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="transportType">Type</Label>
          <select
            id="transportType"
            name="transportType"
            defaultValue={item?.transportType ?? "OTHER"}
            className="flex h-11 rounded-lg border border-border bg-white px-3 text-sm text-charcoal focus:border-brand-green focus:outline-none"
          >
            {TRANSPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRANSPORT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fromLocation">From</Label>
          <Input
            id="fromLocation"
            name="fromLocation"
            defaultValue={item?.fromLocation ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="toLocation">To</Label>
          <Input
            id="toLocation"
            name="toLocation"
            defaultValue={item?.toLocation ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="duration">Approx. duration</Label>
          <Input
            id="duration"
            name="duration"
            defaultValue={item?.duration ?? ""}
            placeholder="e.g. ~3 hours"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priceGuidance">Price guidance</Label>
          <Input
            id="priceGuidance"
            name="priceGuidance"
            defaultValue={item?.priceGuidance ?? ""}
            placeholder="e.g. ₹600–₹900"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="instructions">Practical instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          rows={3}
          defaultValue={item?.instructions ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bookingInfo">Booking information / link</Label>
        <Textarea
          id="bookingInfo"
          name="bookingInfo"
          rows={2}
          defaultValue={item?.bookingInfo ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tapanNote">Tapan&rsquo;s note</Label>
          <Textarea
            id="tapanNote"
            name="tapanNote"
            rows={2}
            defaultValue={item?.tapanNote ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="warning">Warning</Label>
          <Textarea
            id="warning"
            name="warning"
            rows={2}
            defaultValue={item?.warning ?? ""}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add transport" : "Save"}
        </Button>
      </div>
    </form>
  );
}
