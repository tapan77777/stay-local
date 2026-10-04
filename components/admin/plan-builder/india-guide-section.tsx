"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createIndiaGuideItemAction,
  deleteIndiaGuideItemAction,
  moveIndiaGuideItemAction,
  updateIndiaGuideItemAction,
} from "@/lib/plan/actions-2a";
import {
  GUIDE_CATEGORIES,
  GUIDE_CATEGORY_LABEL,
  type IndiaGuideItem,
} from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { ReorderButtons } from "./reorder-buttons";
import { SaveState } from "./save-state";
import { SectionCard } from "./section-card";

interface Props {
  planId: string;
  items: IndiaGuideItem[];
}

export function IndiaGuideSection({ planId, items }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <SectionCard
      title="India Guide"
      description="Plan-level essentials: money, SIM, culture, scams, packing, emergency info."
      action={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add item"}
        </Button>
      }
    >
      {adding ? (
        <div className="mb-5 rounded-xl border border-border bg-cream/30 p-4">
          <GuideForm
            planId={planId}
            mode="create"
            onDone={() => setAdding(false)}
          />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          No guide items yet. Travelers won&rsquo;t see this section until you
          add one.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) =>
            editingId === it.id ? (
              <li
                key={it.id}
                className="rounded-xl border border-border bg-cream/30 p-4"
              >
                <GuideForm
                  planId={planId}
                  mode="edit"
                  item={it}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={it.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-saffron/15 px-2 py-0.5 text-[11px] text-charcoal">
                      {GUIDE_CATEGORY_LABEL[it.category]}
                    </span>
                    <span className="font-serif text-sm text-charcoal">
                      {it.title}
                    </span>
                  </div>
                  {it.content ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                      {it.content}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await moveIndiaGuideItemAction(planId, it.id, direction);
                    }}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(it.id)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Edit
                  </button>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteIndiaGuideItemAction(planId, it.id);
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

function GuideForm({
  planId,
  mode,
  item,
  onDone,
}: {
  planId: string;
  mode: "create" | "edit";
  item?: IndiaGuideItem;
  onDone?: () => void;
}) {
  const action =
    mode === "create"
      ? createIndiaGuideItemAction.bind(null, planId)
      : updateIndiaGuideItemAction.bind(null, planId, item!.id);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto,1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={item?.category ?? "PRACTICAL"}
            className="flex h-11 rounded-lg border border-border bg-white px-3 text-sm text-charcoal focus:border-brand-green focus:outline-none"
          >
            {GUIDE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {GUIDE_CATEGORY_LABEL[c]}
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
            placeholder="e.g. ATMs and card acceptance"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={item?.content ?? ""}
          placeholder="Write what the traveler should know."
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
