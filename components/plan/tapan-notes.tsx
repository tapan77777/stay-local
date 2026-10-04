"use client";

import { TapanNote } from "./tapan-note";
import type { DestinationNote } from "@/lib/plan/types";

/*
 * Editorial list of notes. Order is the admin's chosen position (same as the
 * other modules) — not grouped by type. Keeping the admin's sequence lets
 * Tapan direct the reading like a letter rather than a reference manual.
 */

export interface TapanNotesProps {
  notes: readonly DestinationNote[];
}

export function TapanNotes({ notes }: TapanNotesProps) {
  if (notes.length === 0) return null;
  return (
    <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6">
      <div className="space-y-10 sm:space-y-12">
        {notes.map((n, i) => (
          <TapanNote key={n.id} note={n} index={i} />
        ))}
      </div>
    </section>
  );
}
