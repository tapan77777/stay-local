"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createDestinationNoteAction,
  deleteDestinationNoteAction,
  moveDestinationNoteAction,
  updateDestinationNoteAction,
} from "@/lib/plan/actions-2a";
import {
  NOTE_TYPES,
  NOTE_TYPE_LABEL,
  type DestinationNote,
} from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";

interface Props {
  planId: string;
  destinationId: string;
  items: DestinationNote[];
}

export function NotesEditor({ planId, destinationId, items }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {items.length === 0
            ? "No notes yet."
            : `${items.length} note${items.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add note"}
        </Button>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-cream/30 p-5">
          <NoteForm
            planId={planId}
            destinationId={destinationId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      <ul className="space-y-3">
        {items.map((n, i) =>
          editingId === n.id ? (
            <li
              key={n.id}
              className="rounded-xl border border-border bg-cream/30 p-5"
            >
              <NoteForm
                planId={planId}
                destinationId={destinationId}
                mode="edit"
                item={n}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={n.id}
              className="rounded-xl border border-border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        n.noteType === "WATCH_OUT"
                          ? "rounded-full bg-terracotta/15 px-2 py-0.5 text-[11px] text-terracotta"
                          : n.noteType === "DONT_MISS"
                            ? "rounded-full bg-saffron/20 px-2 py-0.5 text-[11px] text-charcoal"
                            : n.noteType === "ID_SKIP"
                              ? "rounded-full bg-charcoal/[0.06] px-2 py-0.5 text-[11px] text-muted"
                              : "rounded-full bg-brand-green/15 px-2 py-0.5 text-[11px] text-brand-green-dark"
                      }
                    >
                      {NOTE_TYPE_LABEL[n.noteType]}
                    </span>
                    <span className="font-serif text-sm text-charcoal">
                      {n.title}
                    </span>
                  </div>
                  {n.note ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-charcoal">
                      {n.note}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await moveDestinationNoteAction(
                        planId,
                        destinationId,
                        n.id,
                        direction
                      );
                    }}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(n.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteDestinationNoteAction(
                        planId,
                        destinationId,
                        n.id
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

function NoteForm({
  planId,
  destinationId,
  mode,
  item,
  onDone,
}: {
  planId: string;
  destinationId: string;
  mode: "create" | "edit";
  item?: DestinationNote;
  onDone?: () => void;
}) {
  const bound =
    mode === "create"
      ? createDestinationNoteAction.bind(null, planId, destinationId)
      : updateDestinationNoteAction.bind(null, planId, destinationId, item!.id);
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
          <Label htmlFor="noteType">Type</Label>
          <select
            id="noteType"
            name="noteType"
            defaultValue={item?.noteType ?? "MY_TAKE"}
            className="flex h-11 rounded-lg border border-border bg-white px-3 text-sm text-charcoal focus:border-brand-green focus:outline-none"
          >
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {NOTE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={item?.title ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          name="note"
          rows={4}
          defaultValue={item?.note ?? ""}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add note" : "Save"}
        </Button>
      </div>
    </form>
  );
}
