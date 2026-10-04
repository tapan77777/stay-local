"use client";

import Link from "next/link";
import { MapPin, Clock, ArrowUpRight, AlertTriangle } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import { PLACE_PRIORITY_LABEL, type Place } from "@/lib/plan/types";

/*
 * Large editorial place card. Image sits above (or alongside on wider rows)
 * the content block. Every secondary field is rendered only when the admin
 * supplied it — no "—" or placeholder copy.
 */

export interface PlaceCardProps {
  place: Place;
  index: number;
}

function has(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

export function PlaceCard({ place, index }: PlaceCardProps) {
  const metaBits: { label: string; value: string }[] = [];
  if (has(place.duration)) metaBits.push({ label: "Time needed", value: place.duration });
  if (has(place.bestTime)) metaBits.push({ label: "Best time", value: place.bestTime });

  return (
    <CinematicReveal y={16} delay={0.03 + index * 0.03} className="block">
      <article className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        {has(place.imageUrl) ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-warm sm:aspect-[16/10]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              sizes="(min-width: 640px) 672px, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
            />
          </div>
        ) : null}
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
            <span>{PLACE_PRIORITY_LABEL[place.priority]}</span>
          </div>
          <h3 className="mt-2 font-serif text-[26px] leading-[1.1] tracking-tight text-charcoal line-clamp-3 sm:text-[30px]">
            {place.name}
          </h3>
          {has(place.description) ? (
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal/80 sm:text-[15.5px]">
              {place.description}
            </p>
          ) : null}

          {has(place.whyVisit) ? (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
                Why I&apos;d go
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal-soft">
                {place.whyVisit}
              </p>
            </div>
          ) : null}

          {metaBits.length > 0 ? (
            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {metaBits.map((m) => (
                <div key={m.label} className="flex items-start gap-2.5">
                  <Clock size={13} className="mt-1 shrink-0 text-brand-green-dark" />
                  <div className="min-w-0">
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {m.label}
                    </dt>
                    <dd className="mt-0.5 text-[14px] text-charcoal">{m.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          ) : null}

          {has(place.tapanNote) ? (
            <div className="mt-5 rounded-2xl bg-brand-green-light/70 px-4 py-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
                Good to know
              </p>
              <p className="mt-1.5 whitespace-pre-wrap font-serif text-[16px] italic leading-relaxed text-charcoal">
                {place.tapanNote}
              </p>
            </div>
          ) : null}

          {has(place.warning) ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/5 px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-terracotta" />
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                  Watch out
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-charcoal-soft">
                  {place.warning}
                </p>
              </div>
            </div>
          ) : null}

          {has(place.mapUrl) ? (
            <div className="mt-6">
              <Link
                href={place.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-green-dark transition-colors hover:text-charcoal"
              >
                <MapPin size={14} />
                View on map
                <ArrowUpRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                />
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    </CinematicReveal>
  );
}
