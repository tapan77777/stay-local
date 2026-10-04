"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Bed,
  Utensils,
  Bus,
  Sparkles,
  StickyNote,
  Map as MapIcon,
  MessageCircle,
} from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import {
  formatDestinationRange,
  pluralizeNights,
  whatsappHref,
} from "@/lib/plan/format";
import type { Destination, DestinationModuleCounts } from "@/lib/plan/types";

/*
 * Destination Hub — the per-stop landing page. Shows the destination hero,
 * dates, intro and Tapan's intro, then a *filtered* tile grid of modules.
 *
 * Progressive-disclosure rule: tiles only render for modules whose row count
 * is > 0. This is the mandatory rule in the Phase 3 brief — a traveler should
 * never see "Food (0)" or an empty module card. If a module has no content,
 * it does not exist for them.
 *
 * Note: the actual module *pages* are built in a later phase (3C). Each tile
 * links to its intended route; those pages are not implemented in this
 * milestone, so following a tile will land on a Coming Soon placeholder.
 */

export interface DestinationHubProps {
  token: string;
  destination: Destination;
  counts: DestinationModuleCounts;
  whatsappContact: string;
  tripTitle: string;
  prev: { id: string; name: string } | null;
  next: { id: string; name: string } | null;
  index: number;
  totalDestinations: number;
}

interface ModuleTileDef {
  key: keyof DestinationModuleCounts;
  label: string;
  caption: (n: number) => string;
  icon: typeof CalendarDays;
}

const MODULE_TILES: readonly ModuleTileDef[] = [
  {
    key: "itinerary",
    label: "Your days",
    caption: (n) => `See your ${n}-day plan`,
    icon: CalendarDays,
  },
  {
    key: "places",
    label: "Places to visit",
    caption: (n) => `${n} place${n === 1 ? "" : "s"} I'd actually recommend`,
    icon: MapPin,
  },
  {
    key: "food",
    label: "Where to eat",
    caption: (n) => `${n} place${n === 1 ? "" : "s"} worth your time`,
    icon: Utensils,
  },
  {
    key: "transport",
    label: "Getting around",
    caption: () => `How to move around`,
    icon: Bus,
  },
  {
    key: "stays",
    label: "Where to stay",
    caption: (n) =>
      n === 1 ? "Your recommended stay" : `${n} stays to pick from`,
    icon: Bed,
  },
  {
    key: "experiences",
    label: "Experiences",
    caption: (n) =>
      n === 1
        ? "One experience I'd make time for"
        : `${n} experiences I'd make time for`,
    icon: Sparkles,
  },
  {
    key: "map",
    label: "Map",
    caption: () => `Pins I've placed for you`,
    icon: MapIcon,
  },
  {
    key: "notes",
    label: "Tapan's notes",
    caption: (n) => `${n} note${n === 1 ? "" : "s"} to read before you go`,
    icon: StickyNote,
  },
] as const;

export function DestinationHub({
  token,
  destination,
  counts,
  whatsappContact,
  tripTitle,
  prev,
  next,
  index,
  totalDestinations,
}: DestinationHubProps) {
  const d = destination;
  const range = formatDestinationRange(d.arrivalDate, d.departureDate);
  const nights = pluralizeNights(d.nights);
  const visibleTiles = MODULE_TILES.filter((t) => (counts[t.key] ?? 0) > 0);
  const wa = whatsappHref(
    whatsappContact,
    `Hi Tapan — question about ${d.name} on my trip (${tripTitle})`
  );

  return (
    <div className="pb-6">
      <div className="relative">
        <CinematicReveal y={0} scale={1.02} duration={0.95} margin="0px">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-charcoal sm:aspect-[16/9] lg:aspect-[21/9] lg:rounded-3xl">
            {d.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.heroImageUrl}
                alt=""
                loading="eager"
                fetchPriority="high"
                decoding="async"
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-green-dark via-brand-green to-charcoal" />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/20 via-charcoal/40 to-charcoal/85"
            />
          </div>
        </CinematicReveal>

        <div className="relative -mt-28 px-5 pb-2 sm:px-6 lg:-mt-32 lg:px-10">
          <CinematicReveal y={16}>
            <Link
              href={`/plan/${token}/journey`}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/90 hover:text-cream"
            >
              <ArrowLeft size={13} />
              Back to journey
            </Link>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/80">
              Stop {String(index).padStart(2, "0")} of{" "}
              {String(totalDestinations).padStart(2, "0")}
            </p>
            <h1 className="mt-2 font-serif text-[36px] leading-[1.04] tracking-tight text-cream drop-shadow-sm sm:text-[46px] lg:text-[56px]">
              {d.name}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-medium uppercase tracking-[0.14em] text-cream/85">
              {range ? <span>{range}</span> : null}
              {range && nights ? <span aria-hidden>·</span> : null}
              {nights ? <span>{nights}</span> : null}
            </p>
          </CinematicReveal>
        </div>
      </div>

      {d.intro ? (
        <CinematicReveal
          y={14}
          delay={0.08}
          className="mx-auto mt-8 max-w-2xl px-5 sm:px-6"
        >
          <p className="whitespace-pre-wrap text-[15.5px] leading-relaxed text-charcoal-soft lg:text-base">
            {d.intro}
          </p>
        </CinematicReveal>
      ) : null}

      {d.tapanIntro ? (
        <CinematicReveal
          y={14}
          delay={0.12}
          className="mx-auto mt-6 max-w-2xl px-5 sm:px-6"
        >
          <blockquote className="border-l-2 border-brand-green pl-5 font-serif text-[18px] italic leading-snug text-charcoal lg:text-[20px]">
            {d.tapanIntro}
            <footer className="mt-2 text-[11px] font-semibold not-italic uppercase tracking-[0.2em] text-brand-green-dark">
              — Tapan
            </footer>
          </blockquote>
        </CinematicReveal>
      ) : null}

      {visibleTiles.length > 0 ? (
        <section
          aria-labelledby="destination-modules"
          className="mx-auto mt-12 max-w-2xl px-5 sm:px-6"
        >
          <CinematicReveal y={14}>
            <h2
              id="destination-modules"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark"
            >
              What I&apos;ve lined up
            </h2>
          </CinematicReveal>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleTiles.map((tile, i) => {
              const n = counts[tile.key] ?? 0;
              return (
                <CinematicReveal
                  key={tile.key}
                  y={10}
                  delay={0.05 + i * 0.03}
                >
                  <Link
                    href={`/plan/${token}/destinations/${d.id}/${tile.key}`}
                    className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-green/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:p-5"
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
                      <tile.icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-[17px] leading-tight text-charcoal">
                        {tile.label}
                      </span>
                      <span className="mt-1 block text-[13px] text-muted">
                        {tile.caption(n)}
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      className="mt-1 shrink-0 text-brand-green-dark opacity-70 transition-transform group-hover:translate-x-1 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    />
                  </Link>
                </CinematicReveal>
              );
            })}
          </ul>
        </section>
      ) : (
        <CinematicReveal
          y={14}
          className="mx-auto mt-12 max-w-2xl px-5 sm:px-6"
        >
          <div className="rounded-2xl border border-dashed border-border bg-white/60 p-6 text-center">
            <p className="font-serif text-[17px] text-charcoal">
              This stop is still being prepared.
            </p>
            <p className="mt-2 text-[13px] text-muted">
              Tapan is adding the places, routes and notes for {d.name}.
            </p>
          </div>
        </CinematicReveal>
      )}

      {(prev || next) ? (
        <section className="mx-auto mt-14 max-w-2xl px-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {prev ? (
              <Link
                href={`/plan/${token}/destinations/${prev.id}`}
                className="group flex flex-1 items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-green/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              >
                <ArrowLeft
                  size={16}
                  className="shrink-0 text-brand-green-dark transition-transform group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Previous
                  </span>
                  <span className="block truncate font-serif text-[16px] text-charcoal">
                    {prev.name}
                  </span>
                </span>
              </Link>
            ) : null}
            {next ? (
              <Link
                href={`/plan/${token}/destinations/${next.id}`}
                className="group flex flex-1 items-center gap-3 rounded-2xl border border-border bg-white p-4 text-right transition-colors hover:border-brand-green/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Next
                  </span>
                  <span className="block truncate font-serif text-[16px] text-charcoal">
                    {next.name}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-brand-green-dark transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-12 max-w-2xl px-5 sm:px-6">
        <CinematicReveal y={14}>
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-brand-green-light/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-[17px] text-charcoal">
                Something unclear about {d.name}?
              </p>
              <p className="mt-1 text-[13px] text-charcoal-soft">
                Message me on WhatsApp — I usually reply within a few hours.
              </p>
            </div>
            {wa ? (
              <Link
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark"
              >
                <MessageCircle size={14} />
                Message Tapan
              </Link>
            ) : null}
          </div>
        </CinematicReveal>
      </section>
    </div>
  );
}
