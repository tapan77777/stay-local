"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlanDocumentAction,
  deletePlanDocumentAction,
  movePlanDocumentAction,
  updatePlanDocumentAction,
} from "@/lib/plan/actions-2a";
import type { PlanDocument } from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";
import { SectionCard } from "./section-card";

interface Props {
  planId: string;
  documents: PlanDocument[];
}

export function DocumentsSection({ planId, documents }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <SectionCard
      title="Documents"
      description="Optional files or links the traveler should have handy."
      action={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add document"}
        </Button>
      }
    >
      {adding ? (
        <div className="mb-5 rounded-xl border border-border bg-cream/30 p-4">
          <DocForm
            planId={planId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      {documents.length === 0 ? (
        <p className="text-sm text-muted">No documents yet.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((d, i) =>
            editingId === d.id ? (
              <li
                key={d.id}
                className="rounded-xl border border-border bg-cream/30 p-4"
              >
                <DocForm
                  planId={planId}
                  mode="edit"
                  doc={d}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-sm text-charcoal">
                    {d.title}
                  </div>
                  {d.description ? (
                    <p className="mt-0.5 text-sm text-muted">
                      {d.description}
                    </p>
                  ) : null}
                  {d.fileUrl ? (
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-brand-green hover:underline"
                    >
                      Open link ↗
                    </a>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await movePlanDocumentAction(planId, d.id, direction);
                    }}
                    isFirst={i === 0}
                    isLast={i === documents.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(d.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deletePlanDocumentAction(planId, d.id);
                    }}
                  />
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </SectionCard>
  );
}

function DocForm({
  planId,
  mode,
  doc,
  onDone,
}: {
  planId: string;
  mode: "create" | "edit";
  doc?: PlanDocument;
  onDone?: () => void;
}) {
  const action =
    mode === "create"
      ? createPlanDocumentAction.bind(null, planId)
      : updatePlanDocumentAction.bind(null, planId, doc!.id);
  const [state, formAction, pending] = useActionState(
    async (prev: { error: string } | null, fd: FormData) => {
      const result = await action(prev, fd);
      if (!result && onDone) onDone();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={doc?.title ?? ""}
          placeholder="e.g. Flight PDF, visa confirmation"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={doc?.description ?? ""}
          placeholder="A short line about this file"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fileUrl">File URL</Label>
        <Input
          id="fileUrl"
          name="fileUrl"
          defaultValue={doc?.fileUrl ?? ""}
          placeholder="https://… (any shareable link)"
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <SaveState pending={pending} error={state?.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : mode === "create" ? "Add" : "Save"}
        </Button>
      </div>
    </form>
  );
}
