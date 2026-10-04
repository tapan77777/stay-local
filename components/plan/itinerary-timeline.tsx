"use client";

import { ItineraryDayView } from "./itinerary-day";
import type { ItineraryDay } from "@/lib/plan/types";

/*
 * Vertical day-by-day timeline. The connector line sits behind the day cards
 * so each day feels threaded into one editorial sequence rather than a stack
 * of disconnected cards.
 */

export interface ItineraryTimelineProps {
  days: readonly ItineraryDay[];
}

export function ItineraryTimeline({ days }: ItineraryTimelineProps) {
  if (days.length === 0) return null;
  return (
    <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute left-5 top-6 bottom-6 w-px bg-border-strong/60 sm:left-7"
        />
        <ol className="space-y-5">
          {days.map((d, i) => (
            <li key={d.id}>
              <ItineraryDayView day={d} index={i} dayNumber={i + 1} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
