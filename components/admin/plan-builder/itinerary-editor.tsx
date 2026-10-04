"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createItineraryDayAction,
  deleteItineraryDayAction,
  moveItineraryDayAction,
  updateItineraryDayAction,
} from "@/lib/plan/actions-2a";
import { toDateInputValue } from "@/lib/plan/format";
import type { ItineraryDay } from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  days: ItineraryDay[];
}

export function ItineraryEditor({ planId, destinationId, days }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {days.length === 0
            ? "No days yet. Add the first day to begin."
            : `${days.length} day${days.length === 1 ? "" : "s"} planned.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add day"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <DayForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-3">
        {days.map((day, i) =>
          editingId === day.id ? (
            <li
              key={day.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <DayForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                day={day}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={day.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-base text-charcoal">
                    {day.dayLabel || `Day ${i + 1}`}
                  </span>
                  {day.dayDate ? (
                    <span className="text-xs text-muted">{day.dayDate}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await moveItineraryDayAction(
                        planId,
                        destinationId,
                        day.id,
                        direction
                      );
                    }}
                    isFirst={i === 0}
                    isLast={i === days.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(day.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteItineraryDayAction(
                        planId,
                        destinationId,
                        day.id
                      );
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <TimeBlock label="Morning" text={day.morning} />
                <TimeBlock label="Afternoon" text={day.afternoon} />
                <TimeBlock label="Evening" text={day.evening} />
              </div>
              {(day.notes || day.recommendedTiming || day.optionalItems) && (
                <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 text-xs sm:grid-cols-3">
                  {day.recommendedTiming ? (
                    <div>
                      <dt className="text-muted">Recommended timing</dt>
                      <dd className="text-charcoal">
                        {day.recommendedTiming}
                      </dd>
                    </div>
                  ) : null}
                  {day.optionalItems ? (
                    <div>
                      <dt className="text-muted">Optional</dt>
                      <dd className="text-charcoal">{day.optionalItems}</dd>
                    </div>
                  ) : null}
                  {day.notes ? (
                    <div>
                      <dt className="text-muted">Notes</dt>
                      <dd className="whitespace-pre-wrap text-charcoal">
                        {day.notes}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function TimeBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-charcoal">
        {text || <span className="text-muted/60">—</span>}
      </div>
    </div>
  );
}

function DayForm({
  planId,
  destinationId,
  mode,
  day,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  day?: ItineraryDay;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createItineraryDayAction.bind(null, planId, destinationId)
      : updateItineraryDayAction.bind(null, planId, destinationId, day!.id);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dayLabel">Day label</Label>
          <Input
            id="dayLabel"
            name="dayLabel"
            defaultValue={day?.dayLabel ?? ""}
            placeholder="e.g. Day 1 — arrival"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dayDate">Date</Label>
          <Input
            id="dayDate"
            name="dayDate"
            type="date"
            defaultValue={toDateInputValue(day?.dayDate)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="morning">Morning</Label>
          <Textarea
            id="morning"
            name="morning"
            rows={3}
            defaultValue={day?.morning ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="afternoon">Afternoon</Label>
          <Textarea
            id="afternoon"
            name="afternoon"
            rows={3}
            defaultValue={day?.afternoon ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evening">Evening</Label>
          <Textarea
            id="evening"
            name="evening"
            rows={3}
            defaultValue={day?.evening ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="recommendedTiming">Recommended timing</Label>
          <Input
            id="recommendedTiming"
            name="recommendedTiming"
            defaultValue={day?.recommendedTiming ?? ""}
            placeholder="e.g. Start by 8am to beat crowds"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="optionalItems">Optional items</Label>
          <Input
            id="optionalItems"
            name="optionalItems"
            defaultValue={day?.optionalItems ?? ""}
            placeholder="e.g. If energy allows, add the museum"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={day?.notes ?? ""}
          placeholder="Anything else the traveler should know for this day"
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add day" : "Save"}
        </Button>
      </div>
    </form>
  );
}
