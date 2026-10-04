"use client";

import { CinematicReveal } from "@/components/site/motion-primitives";
import { NOTE_TYPE_LABEL, type DestinationNote, type NoteType } from "@/lib/plan/types";

/*
 * A single editorial note. Each note type gets its own label voice.
 * No boxes — just a labeled stanza so a page full of notes reads like a letter.
 *
 * Visual grammar:
 *   - MY_TAKE / DONT_MISS / LOCAL_TIP → quote styling with a left accent
 *   - WATCH_OUT / ID_SKIP            → terracotta accent (gentle warning tone)
 *   - GOOD_TO_KNOW                   → neutral informational
 */

export interface TapanNoteProps {
  note: DestinationNote;
  index: number;
}

function has(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function accentForType(t: NoteType): string {
  switch (t) {
    case "WATCH_OUT":
    case "ID_SKIP":
      return "border-terracotta/70 text-terracotta";
    case "MY_TAKE":
    case "DONT_MISS":
    case "LOCAL_TIP":
      return "border-brand-green text-brand-green-dark";
    case "GOOD_TO_KNOW":
    default:
      return "border-border-strong text-charcoal-soft";
  }
}

function isQuoteStyle(t: NoteType): boolean {
  return t === "MY_TAKE" || t === "DONT_MISS" || t === "LOCAL_TIP";
}

export function TapanNote({ note, index }: TapanNoteProps) {
  const accent = accentForType(note.noteType);
  const quote = isQuoteStyle(note.noteType);

  return (
    <CinematicReveal y={14} delay={0.03 + index * 0.04}>
      <article className={`border-l-2 pl-5 ${accent}`}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em]">
          {NOTE_TYPE_LABEL[note.noteType]}
        </p>
        {has(note.title) ? (
          <h3 className="mt-2 font-serif text-[22px] leading-[1.15] tracking-tight text-charcoal sm:text-[26px]">
            {note.title}
          </h3>
        ) : null}
        {has(note.note) ? (
          quote ? (
            <blockquote className="mt-3 whitespace-pre-wrap font-serif text-[18px] italic leading-relaxed text-charcoal sm:text-[20px]">
              {note.note}
            </blockquote>
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-[15.5px] leading-relaxed text-charcoal-soft sm:text-base">
              {note.note}
            </p>
          )
        ) : null}
      </article>
    </CinematicReveal>
  );
}
