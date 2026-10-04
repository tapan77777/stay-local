"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  deleteDestinationAction,
  moveDestinationAction,
} from "@/lib/plan/actions-2a";
import { formatDateRange } from "@/lib/plan/format";
import type {
  Destination,
  DestinationModuleCounts,
  ModuleKey,
} from "@/lib/plan/types";
import { MODULE_KEYS, MODULE_LABEL } from "@/lib/plan/types";
import { DeleteButton } from "./delete-button";
import { DestinationForm } from "./destination-form";
import { ReorderButtons } from "./reorder-buttons";
import { SectionCard } from "./section-card";

interface Props {
  planId: string;
  destinations: Destination[];
  counts: Record<string, DestinationModuleCounts>;
}

export function JourneySection({ planId, destinations, counts }: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <SectionCard
      title="Your Journey"
      description="Ordered list of destinations the traveler will visit."
      action={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? "Cancel" : "+ Add destination"}
        </Button>
      }
    >
      {adding ? (
        <div className="mb-6 rounded-xl border border-border bg-cream/30 p-5">
          <h3 className="mb-3 font-serif text-sm text-charcoal">
            New destination
          </h3>
          <DestinationForm planId={planId} mode="create" />
        </div>
      ) : null}

      {destinations.length === 0 ? (
        <p className="text-sm text-muted">
          No destinations yet — add one to start building the journey.
        </p>
      ) : (
        <ol className="space-y-3">
          {destinations.map((d, i) => {
            const c = counts[d.id];
            const hasDates = d.arrivalDate || d.departureDate;
            const dateRange = hasDates
              ? formatDateRange(d.arrivalDate, d.departureDate)
              : null;
            const modules = (MODULE_KEYS as readonly ModuleKey[]).filter(
              (k) => (c?.[k] ?? 0) > 0
            );
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-charcoal/[0.06] px-2 py-0.5 text-xs text-muted">
                      {i + 1}
                    </span>
                    <Link
                      href={`/admin/plans/${planId}/destinations/${d.id}`}
                      className="font-serif text-base text-charcoal hover:underline"
                    >
                      {d.name}
                    </Link>
                    {d.nights != null ? (
                      <span className="text-xs text-muted">
                        {d.nights} night{d.nights === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    {dateRange ? (
                      <span className="text-xs text-muted">{dateRange}</span>
                    ) : null}
                  </div>
                  {d.intro ? (
                    <p className="mt-1 line-clamp-1 text-sm text-muted">
                      {d.intro}
                    </p>
                  ) : null}
                  {modules.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {modules.map((k) => (
                        <span
                          key={k}
                          className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] text-brand-green-dark"
                        >
                          {MODULE_LABEL[k]} · {c?.[k]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted">
                      No modules yet — open to add content.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <ReorderButtons
                    onMove={async (direction) => {
                      await moveDestinationAction(planId, d.id, direction);
                    }}
                    isFirst={i === 0}
                    isLast={i === destinations.length - 1}
                  />
                  <Link
                    href={`/admin/plans/${planId}/destinations/${d.id}`}
                    className="rounded-md border border-border px-2 py-1 text-xs text-charcoal hover:bg-charcoal/[0.04]"
                  >
                    Manage
                  </Link>
                  <DeleteButton
                    onDelete={async () => {
                      await deleteDestinationAction(planId, d.id);
                    }}
                    confirmText={`Delete ${d.name}? This removes all its modules.`}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
