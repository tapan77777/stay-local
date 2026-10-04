"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import {
  formatDestinationRange,
  pluralizeNights,
} from "@/lib/plan/format";
import type { DestinationWithCounts } from "@/lib/plan/customer-view";

/*
 * Your Journey — vertical editorial timeline of every destination in order.
 * Each row is a self-contained "stop card" with a photographic lead, dates,
 * a short intro from the admin, and a single call-to-action into that
 * destination's hub. Deliberately quieter than Trip Home: this screen is
 * about *where* the trip goes, not about selling the trip to the traveler.
 */

export interface JourneyTimelineProps {
  token: string;
  tripTitle: string;
  destinations: DestinationWithCounts[];
}

export function JourneyTimeline({
  token,
  tripTitle,
  destinations,
}: JourneyTimelineProps) {
  return (
    <div className="pb-6 pt-6 sm:pt-10 lg:pt-6">
      <header className="mx-auto max-w-2xl px-5 sm:px-6">
        <CinematicReveal y={14}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
            Your journey
          </p>
          <h1 className="mt-3 font-serif text-[32px] leading-[1.06] tracking-tight text-charcoal sm:text-[38px]">
            {tripTitle || "The route I've put together"}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal-soft">
            Here&apos;s how your trip unfolds, in order. Tap any stop to see
            what I&apos;ve lined up there.
          </p>
        </CinematicReveal>
      </header>

      {destinations.length === 0 ? (
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-dashed border-border bg-white/70 px-6 py-10 text-center sm:px-10">
          <p className="font-serif text-lg text-charcoal">
            Your journey is still being planned.
          </p>
          <p className="mt-2 text-[14px] text-muted">
            Tapan will fill in your destinations and routes shortly.
          </p>
        </div>
      ) : (
        <ol className="mx-auto mt-10 max-w-2xl space-y-10 px-5 sm:px-6 sm:space-y-14">
          {destinations.map((dc, i) => (
            <JourneyRow
              key={dc.destination.id}
              token={token}
              dc={dc}
              index={i + 1}
              last={i === destinations.length - 1}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function JourneyRow({
  token,
  dc,
  index,
  last,
}: {
  token: string;
  dc: DestinationWithCounts;
  index: number;
  last: boolean;
}) {
  const d = dc.destination;
  const range = formatDestinationRange(d.arrivalDate, d.departureDate);
  const nights = pluralizeNights(d.nights);
  return (
    <li className="relative">
      {!last ? (
        <span
          aria-hidden
          className="absolute left-[18px] top-[72px] h-[calc(100%-24px)] w-px bg-border-strong/60 sm:left-6"
        />
      ) : null}

      <CinematicReveal y={16}>
        <Link
          href={`/plan/${token}/destinations/${d.id}`}
          className="group block rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-green/40 sm:p-5"
        >
          <div className="flex items-start gap-4 sm:gap-5">
            <span
              aria-hidden
              className="relative z-[1] grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white text-[11px] font-semibold tracking-[0.08em] text-brand-green-dark sm:h-12 sm:w-12 sm:text-[13px]"
            >
              {String(index).padStart(2, "0")}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-serif text-[22px] leading-tight tracking-tight text-charcoal sm:text-[26px]">
                {d.name}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] uppercase tracking-[0.12em] text-muted">
                {range ? <span>{range}</span> : null}
                {range && nights ? <span aria-hidden>·</span> : null}
                {nights ? <span>{nights}</span> : null}
              </p>

              {d.heroImageUrl ? (
                <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-cream-warm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.heroImageUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
              ) : null}

              {d.intro ? (
                <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-charcoal-soft">
                  {d.intro}
                </p>
              ) : (
                <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
                  <MapPin size={13} className="shrink-0" />
                  Details coming soon.
                </p>
              )}

              <p className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-green-dark">
                Explore {d.name}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </p>
            </div>
          </div>
        </Link>
      </CinematicReveal>
    </li>
  );
}
