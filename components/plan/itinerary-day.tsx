"use client";

import { CinematicReveal } from "@/components/site/motion-primitives";
import type { ItineraryDay } from "@/lib/plan/types";

/*
 * One day in the itinerary timeline. Renders a date-stamped stanza with the
 * admin-supplied morning / afternoon / evening blocks and optional notes.
 * Every optional field is hidden when empty — a day only shows what Tapan
 * actually wrote for that date.
 */

export interface ItineraryDayProps {
  day: ItineraryDay;
  index: number;
  dayNumber: number;
}

const UTC_MONTH_SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const UTC_DAY = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  timeZone: "UTC",
});
const UTC_WEEKDAY = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "UTC",
});

function hasContent(s: string | null | undefined): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

interface Block {
  label: string;
  body: string;
}

function dayBlocks(day: ItineraryDay): Block[] {
  const out: Block[] = [];
  if (hasContent(day.morning)) out.push({ label: "Morning", body: day.morning });
  if (hasContent(day.afternoon)) out.push({ label: "Afternoon", body: day.afternoon });
  if (hasContent(day.evening)) out.push({ label: "Evening", body: day.evening });
  return out;
}

export function ItineraryDayView({ day, index, dayNumber }: ItineraryDayProps) {
  const date = day.dayDate ? new Date(day.dayDate) : null;
  const dateValid = date && !Number.isNaN(date.getTime()) ? date : null;
  const blocks = dayBlocks(day);
  const hasRecommended = hasContent(day.recommendedTiming);
  const hasOptional = hasContent(day.optionalItems);
  const hasNotes = hasContent(day.notes);

  return (
    <CinematicReveal
      y={14}
      delay={0.03 + index * 0.03}
      className="relative"
    >
      <article className="relative rounded-3xl bg-white px-5 py-6 shadow-[0_1px_2px_rgba(20,30,25,0.04)] sm:px-7 sm:py-8">
        <header className="flex items-start gap-4 sm:gap-5">
          {dateValid ? (
            <div className="flex min-w-[64px] flex-col items-start border-r border-border/70 pr-4 sm:min-w-[76px] sm:pr-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
                {UTC_MONTH_SHORT.format(dateValid)}
              </span>
              <span className="mt-1 font-serif text-[36px] leading-none text-charcoal sm:text-[42px]">
                {UTC_DAY.format(dateValid)}
              </span>
              <span className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                {UTC_WEEKDAY.format(dateValid)}
              </span>
            </div>
          ) : (
            <div className="flex min-w-[64px] flex-col items-start border-r border-border/70 pr-4 sm:min-w-[76px] sm:pr-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
                Day
              </span>
              <span className="mt-1 font-serif text-[36px] leading-none text-charcoal sm:text-[42px]">
                {String(dayNumber).padStart(2, "0")}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
              Day {String(dayNumber).padStart(2, "0")}
            </p>
            {hasContent(day.dayLabel) ? (
              <h3 className="mt-1 font-serif text-[22px] leading-[1.15] tracking-tight text-charcoal sm:text-[26px]">
                {day.dayLabel}
              </h3>
            ) : null}
          </div>
        </header>

        {blocks.length > 0 ? (
          <div className="mt-6 space-y-5">
            {blocks.map((b) => (
              <div key={b.label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
                  {b.label}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal-soft sm:text-[15.5px]">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {hasRecommended ? (
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
              Timing
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-charcoal-soft">
              {day.recommendedTiming}
            </p>
          </div>
        ) : null}

        {hasOptional ? (
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
              If you have time
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-charcoal-soft">
              {day.optionalItems}
            </p>
          </div>
        ) : null}

        {hasNotes ? (
          <div className="mt-6 rounded-2xl bg-brand-green-light/70 px-4 py-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
              Tapan&apos;s note
            </p>
            <p className="mt-1.5 whitespace-pre-wrap font-serif text-[16px] italic leading-relaxed text-charcoal">
              {day.notes}
            </p>
          </div>
        ) : null}
      </article>
    </CinematicReveal>
  );
}
