"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bed,
  Bus,
  CalendarDays,
  Map as MapIcon,
  MapPin,
  Sparkles,
  StickyNote,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import {
  formatDestinationRange,
  pluralizeNights,
} from "@/lib/plan/format";
import type {
  Destination,
  DestinationModuleCounts,
} from "@/lib/plan/types";
import type { DestinationWithCounts } from "@/lib/plan/customer-view";

/*
 * Journey page — organized city-by-city.
 *
 * For every destination in the plan, we render one horizontally-scrolling
 * rail of up to eight section cards (itinerary, places, food, transport,
 * stays, experiences, map, notes). Each card deep-links into that
 * destination's own module route. We filter out modules whose row count is
 * zero so the progressive-disclosure contract from Destination Hub is
 * honored here too — travelers never see an empty section card.
 *
 * No section-specific image column exists, so cards use their destination's
 * hero photo as the backdrop; the section is clearly identified by its
 * icon badge, serif title, and real content count beneath it. If a
 * destination has no hero image, a gradient fallback stands in. No image
 * URL is ever fabricated.
 */

export interface JourneyTimelineProps {
  token: string;
  tripTitle: string;
  destinations: DestinationWithCounts[];
}

interface SectionTile {
  key: keyof DestinationModuleCounts;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  caption: (n: number) => string;
}

// Order and copy mirror the Destination Hub tiles so a traveler reading the
// Journey page and the Destination Hub sees the same labels / captions for
// the same module.
const SECTION_TILES: readonly SectionTile[] = [
  {
    key: "itinerary",
    label: "Your days",
    shortLabel: "Itinerary",
    icon: CalendarDays,
    caption: (n) => `See your ${n}-day plan`,
  },
  {
    key: "places",
    label: "Places to visit",
    shortLabel: "Places",
    icon: MapPin,
    caption: (n) => `${n} place${n === 1 ? "" : "s"} I'd actually recommend`,
  },
  {
    key: "food",
    label: "Where to eat",
    shortLabel: "Food",
    icon: Utensils,
    caption: (n) => `${n} place${n === 1 ? "" : "s"} worth your time`,
  },
  {
    key: "transport",
    label: "Getting around",
    shortLabel: "Transport",
    icon: Bus,
    caption: () => `How to move around`,
  },
  {
    key: "stays",
    label: "Where to stay",
    shortLabel: "Stays",
    icon: Bed,
    caption: (n) =>
      n === 1 ? "Your recommended stay" : `${n} stays to pick from`,
  },
  {
    key: "experiences",
    label: "Experiences",
    shortLabel: "Experiences",
    icon: Sparkles,
    caption: (n) =>
      n === 1
        ? "One experience I'd make time for"
        : `${n} experiences I'd make time for`,
  },
  {
    key: "map",
    label: "Your map",
    shortLabel: "Map",
    icon: MapIcon,
    caption: () => `Pins I've placed for you`,
  },
  {
    key: "notes",
    label: "Tapan's notes",
    shortLabel: "Notes",
    icon: StickyNote,
    caption: (n) => `${n} note${n === 1 ? "" : "s"} to read before you go`,
  },
] as const;

export function JourneyTimeline({
  token,
  tripTitle,
  destinations,
}: JourneyTimelineProps) {
  const routeLine = destinations
    .map((d) => d.destination.name)
    .filter(Boolean)
    .join(" → ");
  const heroImage =
    destinations.find((d) => d.destination.heroImageUrl)?.destination
      .heroImageUrl ?? null;

  return (
    <div className="pb-6">
      <JourneyHero
        token={token}
        tripTitle={tripTitle}
        routeLine={routeLine}
        heroImage={heroImage}
      />

      {destinations.length === 0 ? (
        <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6 lg:px-10">
          <CinematicReveal y={14}>
            <div className="rounded-2xl border border-dashed border-border bg-white/70 px-6 py-10 text-center">
              <p className="font-serif text-lg text-charcoal">
                Your journey is still being planned.
              </p>
              <p className="mt-2 text-[14px] text-muted">
                Tapan will fill in your destinations shortly.
              </p>
            </div>
          </CinematicReveal>
        </section>
      ) : (
        <ol className="mt-6 space-y-12 sm:mt-8 sm:space-y-16">
          {destinations.map((dc, i) => (
            <li key={dc.destination.id}>
              <CityRail
                token={token}
                destination={dc.destination}
                counts={dc.counts}
                index={i}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------- Hero ---------- */

function JourneyHero({
  token,
  tripTitle,
  routeLine,
  heroImage,
}: {
  token: string;
  tripTitle: string;
  routeLine: string;
  heroImage: string | null;
}) {
  return (
    <div className="relative">
      <CinematicReveal y={0} scale={1.02} duration={0.95} margin="0px">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-charcoal sm:aspect-[16/9] lg:aspect-[21/8] lg:rounded-3xl">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/15 via-charcoal/40 to-charcoal/85"
          />
        </div>
      </CinematicReveal>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-start px-5 pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:pt-8">
        <Link
          href={`/plan/${token}`}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-charcoal/45 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream backdrop-blur-sm transition-colors hover:bg-charcoal/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
        >
          <ArrowLeft size={13} />
          Trip home
        </Link>
      </div>

      <div className="absolute inset-x-0 bottom-6 px-5 sm:bottom-8 sm:px-6 lg:bottom-10 lg:px-10">
        <CinematicReveal y={16}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/85">
            {tripTitle || "Your journey"}
          </p>
          <h1 className="mt-2 font-serif text-[36px] leading-[1.04] tracking-tight text-cream drop-shadow-sm sm:text-[48px] lg:text-[64px]">
            Your journey
          </h1>
          {routeLine ? (
            <p
              className="mt-3 line-clamp-2 text-[13px] font-medium text-cream/90 sm:text-[14px]"
              aria-label="Trip route"
            >
              {routeLine}
            </p>
          ) : null}
        </CinematicReveal>
      </div>
    </div>
  );
}

/* ---------- City rail ---------- */

function CityRail({
  token,
  destination,
  counts,
  index,
}: {
  token: string;
  destination: Destination;
  counts: DestinationModuleCounts;
  index: number;
}) {
  const visibleTiles = SECTION_TILES.filter(
    (t) => (counts[t.key] ?? 0) > 0
  );
  const subtitle = firstSentence(destination.intro || destination.tapanIntro);
  const range = formatDestinationRange(
    destination.arrivalDate,
    destination.departureDate
  );
  const nights = pluralizeNights(destination.nights);
  const hubHref = `/plan/${token}/destinations/${destination.id}`;

  return (
    <section
      aria-labelledby={`city-${destination.id}`}
      className="mx-auto max-w-6xl"
    >
      <div className="px-5 sm:px-6 lg:px-10">
        <CinematicReveal y={14}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
            Stop {String(index + 1).padStart(2, "0")}
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={`city-${destination.id}`}
                className="font-serif text-[26px] leading-[1.08] tracking-tight text-charcoal sm:text-[32px]"
              >
                {destination.name}
              </h2>
              {range || nights ? (
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted">
                  {range ? <span>{range}</span> : null}
                  {range && nights ? <span aria-hidden>·</span> : null}
                  {nights ? <span>{nights}</span> : null}
                </p>
              ) : null}
              {subtitle ? (
                <p className="mt-2 line-clamp-2 max-w-xl text-[14px] leading-relaxed text-charcoal-soft">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <Link
              href={hubHref}
              className="shrink-0 whitespace-nowrap text-[13px] font-medium text-brand-green-dark transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
            >
              View destination →
            </Link>
          </div>
        </CinematicReveal>
      </div>

      {visibleTiles.length === 0 ? (
        <div className="mx-auto mt-5 max-w-6xl px-5 sm:px-6 lg:px-10">
          <CinematicReveal y={10}>
            <div className="rounded-2xl border border-dashed border-border bg-white/70 px-6 py-8 text-center">
              <p className="font-serif text-[16px] text-charcoal">
                This stop is still being prepared.
              </p>
              <p className="mt-2 text-[13px] text-muted">
                Tapan is adding the places, routes, and notes for{" "}
                {destination.name}.
              </p>
            </div>
          </CinematicReveal>
        </div>
      ) : (
        <div className="hide-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:px-6 lg:px-10">
          {visibleTiles.map((tile, i) => (
            <SectionCard
              key={tile.key}
              tile={tile}
              count={counts[tile.key] ?? 0}
              destination={destination}
              token={token}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Section card ---------- */

function SectionCard({
  tile,
  count,
  destination,
  token,
  index,
}: {
  tile: SectionTile;
  count: number;
  destination: Destination;
  token: string;
  index: number;
}) {
  const Icon = tile.icon;
  const href = `/plan/${token}/destinations/${destination.id}/${tile.key}`;
  // Resolution chain: module-specific override → destination hero → gradient.
  // Admin has not fabricated anything; empty string stays empty here.
  const moduleImage = destination.moduleImageUrls?.[tile.key]?.trim() ?? "";
  const hero = destination.heroImageUrl?.trim() ?? "";
  const cardImage = moduleImage || hero;
  return (
    <CinematicReveal
      y={16}
      delay={0.04 + index * 0.03}
      className="w-[82%] max-w-[300px] shrink-0 snap-start sm:w-[320px] sm:max-w-none lg:w-[360px]"
    >
      <Link
        href={href}
        className="group block overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(20,30,25,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream-warm">
          {cardImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardImage}
              alt=""
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 82vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <DestinationFallback name={destination.name} />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/15 to-charcoal/5"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-green-dark">
            <Icon size={11} strokeWidth={2} aria-hidden />
            {tile.shortLabel}
          </span>
          <div className="absolute inset-x-4 bottom-4">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-cream/85">
              {destination.name}
            </p>
            <h3 className="mt-1 font-serif text-[22px] leading-[1.1] tracking-tight text-cream drop-shadow-sm sm:text-[24px]">
              {tile.label}
            </h3>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <p className="line-clamp-2 text-[13.5px] leading-relaxed text-charcoal-soft">
            {tile.caption(count)}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              {countBadge(tile.key, count)}
            </span>
            <span
              aria-hidden
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-green text-white transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            >
              <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    </CinematicReveal>
  );
}

function DestinationFallback({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "·";
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-green-dark via-brand-green to-charcoal" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-serif text-[64px] leading-none text-cream/60">
          {initial}
        </span>
      </div>
      <span className="sr-only">{name} image unavailable</span>
    </div>
  );
}

/* ---------- helpers ---------- */

function firstSentence(s: string | null | undefined): string {
  if (!s) return "";
  const trimmed = s.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  if (match) return match[1].trim();
  if (trimmed.length > 140) {
    return trimmed.slice(0, 140).replace(/\s+\S*$/, "") + "…";
  }
  return trimmed;
}

function countBadge(
  key: keyof DestinationModuleCounts,
  n: number
): string {
  switch (key) {
    case "itinerary":
      return `${n} day${n === 1 ? "" : "s"}`;
    case "places":
      return `${n} place${n === 1 ? "" : "s"}`;
    case "food":
      return `${n} spot${n === 1 ? "" : "s"}`;
    case "transport":
      return `${n} route${n === 1 ? "" : "s"}`;
    case "stays":
      return `${n} stay${n === 1 ? "" : "s"}`;
    case "experiences":
      return `${n} experience${n === 1 ? "" : "s"}`;
    case "map":
      return `${n} pin${n === 1 ? "" : "s"}`;
    case "notes":
      return `${n} note${n === 1 ? "" : "s"}`;
  }
}
