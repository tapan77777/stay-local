"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import {
  formatDestinationRange,
  formatTripRange,
  pluralizeNights,
  tripLengthDays,
  whatsappHref,
} from "@/lib/plan/format";
import type { DestinationWithCounts } from "@/lib/plan/customer-view";
import type { Destination, PlanWithCustomer } from "@/lib/plan/types";

/*
 * Trip Home — the integrated first screen after unlocking. Composes, top to
 * bottom: hero with overlaid identity, overlapping trip-summary panel,
 * circular destination rail, three editorial highlight cards, map preview,
 * featured first-stop, and a compact Tapan-note card that opens a modal
 * with the full personal content. All data arrives via props; no DB access.
 */

export interface TripHomeProps {
  token: string;
  plan: PlanWithCustomer;
  destinations: DestinationWithCounts[];
  totalNights: number;
}

export function TripHome({
  token,
  plan,
  destinations,
  totalNights,
}: TripHomeProps) {
  const [noteOpen, setNoteOpen] = useState(false);

  const firstName =
    (plan.customer?.name || plan.travelerName || "").trim().split(" ")[0] ||
    "";
  const dateLine = formatTripRange(plan.startDate, plan.endDate);
  const days = tripLengthDays(plan.startDate, plan.endDate, plan.tripDays);
  const heroImage = destinations.find((d) => d.destination.heroImageUrl)
    ?.destination.heroImageUrl;
  const whatsapp = whatsappHref(
    plan.whatsappContact,
    `Hi Tapan — I have a question about my trip (${plan.title})`
  );
  const first = destinations[0];
  const upNext = first?.destination;
  const upNextActive = first?.activeModuleCount ?? 0;
  const highlights = destinations.slice(0, 3);

  const metaBits: string[] = [];
  if (days != null) metaBits.push(`${days} day${days === 1 ? "" : "s"}`);
  if (destinations.length)
    metaBits.push(
      `${destinations.length} destination${destinations.length === 1 ? "" : "s"}`
    );
  if (totalNights > 0 && days == null)
    metaBits.push(`${totalNights} night${totalNights === 1 ? "" : "s"}`);
  const metaLine = metaBits.join(" · ");
  const description = describeDestinations(destinations) || plan.subtitle;

  return (
    <div className="pb-10">
      <HeroWithSummary
        token={token}
        firstName={firstName}
        heroImage={heroImage}
        dateLine={dateLine}
        metaLine={metaLine}
        description={description}
      />

      {destinations.length > 0 ? (
        <DestinationRail
          token={token}
          planStartDate={plan.startDate}
          destinations={destinations}
        />
      ) : null}

      {highlights.length > 0 ? (
        <JourneyGlance
          token={token}
          planStartDate={plan.startDate}
          highlights={highlights}
        />
      ) : null}

      <MapPreview
        token={token}
        destinationCount={destinations.length}
      />

      {upNext ? (
        <FirstStop
          token={token}
          destination={upNext}
          activeModuleCount={upNextActive}
        />
      ) : null}

      <TapanNoteTrigger onOpen={() => setNoteOpen(true)} />

      <TapanNoteModal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        quote={plan.subtitle}
        preferences={plan.specialPreferences}
        whatsapp={whatsapp}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function HeroWithSummary({
  token,
  firstName,
  heroImage,
  dateLine,
  metaLine,
  description,
}: {
  token: string;
  firstName: string;
  heroImage?: string;
  dateLine: string;
  metaLine: string;
  description: string;
}) {
  const initial = firstName ? firstName[0]?.toUpperCase() : "";
  return (
    <section aria-label="Trip hero" className="relative">
      <CinematicReveal y={16} scale={1.01} duration={0.95} margin="0px">
        <div className="mx-auto max-w-4xl px-0 sm:px-6 lg:px-0">
          <div className="relative overflow-hidden rounded-none bg-charcoal shadow-[0_14px_38px_-14px_rgba(20,30,25,0.3)] sm:rounded-3xl">
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[21/9]">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  sizes="(min-width: 1024px) 896px, (min-width: 640px) 100vw, 100vw"
                  className="h-full w-full object-cover"
                />
              ) : (
                <PhotoFallback />
              )}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/55 via-charcoal/10 to-charcoal/80"
              />

              {/* Top-left identity row */}
              <div className="absolute inset-x-0 top-0 px-5 pt-5 sm:px-7 sm:pt-6 lg:px-9 lg:pt-7">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/95 text-[12px] font-semibold text-brand-green-dark shadow-[0_1px_2px_rgba(20,30,25,0.08)]"
                  >
                    {initial || "SL"}
                  </span>
                  <span className="min-w-0 leading-tight drop-shadow-sm">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-cream/80">
                      Namaste
                    </span>
                    <span className="block font-serif text-[14px] text-cream sm:text-[15px]">
                      {firstName || "Welcome"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Headline block, lifted above the overlapping summary */}
              <div className="absolute inset-x-0 bottom-[88px] px-6 sm:bottom-[104px] sm:px-9 lg:bottom-[120px] lg:px-11">
                <h1 className="font-serif text-[36px] leading-[1.02] tracking-tight text-cream drop-shadow sm:text-[48px] lg:text-[58px]">
                  Your India Journey
                </h1>
                {dateLine ? (
                  <p className="mt-2 font-serif text-[14px] italic text-cream/90 drop-shadow sm:text-[16px]">
                    {dateLine}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-cream/80 drop-shadow-sm sm:text-[10.5px]">
                  Planned with StayLocal
                </p>
              </div>
            </div>
          </div>
        </div>
      </CinematicReveal>

      {/* Overlapping trip-summary panel */}
      <div className="relative z-10 mx-auto -mt-14 max-w-4xl px-4 sm:-mt-16 sm:px-10 lg:-mt-20 lg:px-14">
        <CinematicReveal y={14} delay={0.08}>
          <SummaryPanel
            token={token}
            metaLine={metaLine}
            description={description}
          />
        </CinematicReveal>
      </div>
    </section>
  );
}

function SummaryPanel({
  token,
  metaLine,
  description,
}: {
  token: string;
  metaLine: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-white px-5 py-4 shadow-[0_18px_42px_-16px_rgba(20,30,25,0.28)] sm:gap-5 sm:px-6 sm:py-5">
      <div className="min-w-0 flex-1">
        {metaLine ? (
          <p className="font-serif text-[17px] leading-tight text-charcoal sm:text-[19px]">
            {metaLine}
          </p>
        ) : (
          <p className="font-serif text-[17px] leading-tight text-charcoal sm:text-[19px]">
            Your India trip
          </p>
        )}
        {description ? (
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted sm:text-[13px]">
            {description}
          </p>
        ) : null}
      </div>
      <Link
        href={`/plan/${token}/journey`}
        aria-label="Open the full journey timeline"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-green text-white shadow-sm transition-colors hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:h-12 sm:w-12"
      >
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function DestinationRail({
  token,
  planStartDate,
  destinations,
}: {
  token: string;
  planStartDate: string | null;
  destinations: DestinationWithCounts[];
}) {
  return (
    <section
      aria-label="Destinations in order"
      className="mt-8 sm:mt-10"
    >
      <div className="hide-scrollbar overflow-x-auto">
        <div
          role="list"
          className="flex items-start gap-0 px-5 pb-1 sm:px-6 lg:mx-auto lg:max-w-4xl lg:justify-start lg:px-0"
        >
          {destinations.map((d, i) => (
            <DestinationRailItem
              key={d.destination.id}
              token={token}
              planStartDate={planStartDate}
              destination={d.destination}
              index={i}
              isLast={i === destinations.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DestinationRailItem({
  token,
  planStartDate,
  destination,
  index,
  isLast,
}: {
  token: string;
  planStartDate: string | null;
  destination: Destination;
  index: number;
  isLast: boolean;
}) {
  const dayLabel =
    dayLabelForDestination(
      planStartDate,
      destination.arrivalDate,
      destination.departureDate,
      destination.nights
    ) ||
    formatDestinationRange(destination.arrivalDate, destination.departureDate);
  return (
    <CinematicReveal
      y={10}
      delay={index * 0.04}
      className="flex items-start"
    >
      <Link
        href={`/plan/${token}/destinations/${destination.id}`}
        role="listitem"
        className="group flex w-[92px] shrink-0 flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:w-24"
      >
        <span className="relative h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-white bg-cream-warm shadow-[0_4px_18px_-6px_rgba(20,30,25,0.3)] transition-transform group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-20 sm:w-20">
          {destination.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={destination.heroImageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              sizes="80px"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-brand-green-dark/40">
              <MapPin size={18} strokeWidth={1.4} />
            </span>
          )}
        </span>
        <span className="mt-2 block max-w-full truncate font-serif text-[13px] leading-tight text-charcoal transition-colors group-hover:text-brand-green-dark sm:text-[14px]">
          {destination.name}
        </span>
        {dayLabel ? (
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            {dayLabel}
          </span>
        ) : null}
      </Link>
      {!isLast ? (
        <span
          aria-hidden
          className="mt-[32px] inline-flex shrink-0 items-center gap-1 px-1.5 sm:mt-9 sm:px-2"
        >
          <span className="h-px w-4 bg-border-strong sm:w-5" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
          <span className="h-px w-4 bg-border-strong sm:w-5" />
        </span>
      ) : null}
    </CinematicReveal>
  );
}

/* ------------------------------------------------------------------------ */

function JourneyGlance({
  token,
  planStartDate,
  highlights,
}: {
  token: string;
  planStartDate: string | null;
  highlights: DestinationWithCounts[];
}) {
  return (
    <section
      aria-labelledby="trip-home-glance"
      className="mt-12 sm:mt-14"
    >
      <div className="mx-auto flex max-w-4xl items-end justify-between gap-4 px-5 sm:px-6 lg:px-0">
        <CinematicReveal y={12}>
          <h2
            id="trip-home-glance"
            className="font-serif text-[22px] leading-tight tracking-tight text-charcoal sm:text-[26px]"
          >
            Your journey at a glance
          </h2>
        </CinematicReveal>
        <CinematicReveal y={12} delay={0.05}>
          <Link
            href={`/plan/${token}/journey`}
            className="shrink-0 text-[12.5px] font-medium text-charcoal-soft underline-offset-4 hover:text-brand-green-dark hover:underline"
          >
            View full itinerary →
          </Link>
        </CinematicReveal>
      </div>

      <div className="mt-5 sm:mt-6">
        <ul className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:gap-4 sm:px-6 lg:mx-auto lg:grid lg:max-w-4xl lg:grid-cols-3 lg:gap-5 lg:overflow-x-visible lg:px-0">
          {highlights.map((d, i) => (
            <li
              key={d.destination.id}
              className="w-[78%] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none"
            >
              <CinematicReveal y={14} delay={i * 0.05}>
                <HighlightCard
                  token={token}
                  destination={d.destination}
                  planStartDate={planStartDate}
                />
              </CinematicReveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HighlightCard({
  token,
  destination,
  planStartDate,
}: {
  token: string;
  destination: Destination;
  planStartDate: string | null;
}) {
  const dayLabel =
    dayLabelForDestination(
      planStartDate,
      destination.arrivalDate,
      destination.departureDate,
      destination.nights
    ) ||
    formatDestinationRange(destination.arrivalDate, destination.departureDate);
  const description =
    destination.intro?.trim() ||
    destination.tapanIntro?.trim() ||
    "Open the destination to see what Tapan has lined up.";
  return (
    <Link
      href={`/plan/${token}/destinations/${destination.id}`}
      className="group block h-full overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)] transition-shadow hover:shadow-[0_20px_42px_-18px_rgba(20,30,25,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
    >
      <div className="relative aspect-[16/10] w-full bg-cream-warm">
        {destination.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={destination.heroImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 290px, 300px"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <PhotoFallback />
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-5 py-5">
        <div className="min-w-0">
          {dayLabel ? (
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
              {dayLabel}
            </p>
          ) : null}
          <p className="mt-1 font-serif text-[19px] leading-tight text-charcoal transition-colors group-hover:text-brand-green-dark sm:text-[20px]">
            {destination.name}
          </p>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {description}
          </p>
        </div>
        <span
          aria-hidden
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark transition-colors group-hover:bg-brand-green-light"
        >
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------------ */

function MapPreview({
  token,
  destinationCount,
}: {
  token: string;
  destinationCount: number;
}) {
  return (
    <section
      aria-labelledby="trip-home-map"
      className="mx-auto mt-12 max-w-4xl px-5 sm:mt-14 sm:px-6 lg:px-0"
    >
      <CinematicReveal y={14}>
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
          <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-brand-green-light via-cream to-cream-warm sm:aspect-[21/8]">
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(13,107,80,0.14) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            <svg
              aria-hidden
              viewBox="0 0 400 180"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <path
                d="M50 140 Q 130 70 200 120 T 360 50"
                fill="none"
                strokeWidth="1.6"
                strokeDasharray="5 7"
                className="stroke-brand-green-dark/55"
              />
              <circle cx="50" cy="140" r="5" className="fill-brand-green-dark" />
              <circle cx="200" cy="120" r="5" className="fill-brand-green-dark" />
              <circle cx="360" cy="50" r="5.5" className="fill-terracotta" />
            </svg>
            <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted backdrop-blur-sm">
              Illustration
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7 sm:py-6">
            <div className="min-w-0">
              <h2
                id="trip-home-map"
                className="font-serif text-[20px] leading-tight text-charcoal sm:text-[22px]"
              >
                Your route on map
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted sm:text-[13px]">
                See all places, stays, food spots and experiences.
                {destinationCount > 0
                  ? ` ${destinationCount} ${destinationCount === 1 ? "destination" : "destinations"} on the trip.`
                  : ""}
              </p>
            </div>
            <Link
              href={`/plan/${token}/map`}
              aria-label="Open the full trip map"
              className="inline-flex shrink-0 items-center gap-2 self-center rounded-full bg-charcoal px-4 py-2.5 text-[12.5px] font-medium text-cream transition-colors hover:bg-charcoal-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
            >
              Open map
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </CinematicReveal>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

function FirstStop({
  token,
  destination,
  activeModuleCount,
}: {
  token: string;
  destination: Destination;
  activeModuleCount: number;
}) {
  const range = formatDestinationRange(
    destination.arrivalDate,
    destination.departureDate
  );
  const nights = pluralizeNights(destination.nights);
  return (
    <section
      aria-labelledby="trip-home-first-stop"
      className="mx-auto mt-12 max-w-4xl px-5 sm:mt-14 sm:px-6 lg:px-0"
    >
      <CinematicReveal y={14}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
              Begins with
            </p>
            <h2
              id="trip-home-first-stop"
              className="mt-1.5 font-serif text-[22px] leading-tight tracking-tight text-charcoal sm:text-[26px]"
            >
              Your first stop
            </h2>
          </div>
        </div>
        <Link
          href={`/plan/${token}/destinations/${destination.id}`}
          className="group mt-5 block overflow-hidden rounded-3xl bg-charcoal transition-shadow hover:shadow-[0_22px_52px_-14px_rgba(20,30,25,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
        >
          <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[16/9]">
            {destination.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={destination.heroImageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                sizes="(min-width: 1024px) 896px, 100vw"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            ) : (
              <PhotoFallback />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/15 to-transparent"
            />
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:inset-x-7 sm:bottom-6">
              <div className="min-w-0">
                <p className="font-serif text-[26px] leading-[1.05] text-cream drop-shadow sm:text-[32px]">
                  {destination.name}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-medium text-cream/85">
                  {range ? <span>{range}</span> : null}
                  {range && nights ? (
                    <span
                      aria-hidden
                      className="h-[3px] w-[3px] rounded-full bg-cream/70"
                    />
                  ) : null}
                  {nights ? <span>{nights}</span> : null}
                  {activeModuleCount > 0 ? (
                    <>
                      <span
                        aria-hidden
                        className="h-[3px] w-[3px] rounded-full bg-cream/70"
                      />
                      <span>
                        {activeModuleCount}{" "}
                        {activeModuleCount === 1 ? "guide" : "guides"} ready
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-[12px] font-medium text-charcoal transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                Open destination
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </Link>
      </CinematicReveal>
    </section>
  );
}

/* ------------------------------------------------------------------------ */

function TapanNoteTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <section
      aria-labelledby="trip-home-tapan-trigger"
      className="mx-auto mt-12 max-w-2xl px-5 sm:mt-14 sm:px-6 lg:px-0"
    >
      <CinematicReveal y={12}>
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          className="group flex w-full items-center gap-4 rounded-3xl border border-border/70 bg-white px-4 py-4 text-left shadow-[0_1px_2px_rgba(20,30,25,0.04)] transition-shadow hover:shadow-[0_18px_38px_-18px_rgba(20,30,25,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:px-5 sm:py-5"
        >
          <span
            aria-hidden
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/60 bg-cream-warm sm:h-14 sm:w-14"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tapan.jpg"
              alt=""
              loading="lazy"
              decoding="async"
              sizes="56px"
              className="h-full w-full object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span
              id="trip-home-tapan-trigger"
              className="block font-serif text-[17px] leading-tight text-charcoal sm:text-[18px]"
            >
              A note from Tapan
            </span>
            <span className="mt-0.5 block text-[12.5px] text-muted">
              A few local tips, just for you.
            </span>
          </span>
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-green-light text-brand-green-dark transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          >
            <ArrowRight size={16} />
          </span>
        </button>
      </CinematicReveal>
    </section>
  );
}

function TapanNoteModal({
  open,
  onClose,
  quote,
  preferences,
  whatsapp,
}: {
  open: boolean;
  onClose: () => void;
  quote: string;
  preferences: string;
  whatsapp: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      try {
        d.showModal();
      } catch {
        // Some browsers may refuse showModal from inert contexts; swallow silently.
      }
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDialogElement>
  ) => {
    if (e.target === dialogRef.current) onClose();
  };

  const hasQuote = Boolean(quote?.trim());
  const hasPrefs = Boolean(preferences?.trim());

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="tapan-note-modal-title"
      className="m-auto w-[min(94vw,480px)] max-h-[88vh] overflow-hidden rounded-3xl bg-cream-warm p-0 text-charcoal shadow-[0_30px_80px_-20px_rgba(20,30,25,0.5)] backdrop:bg-charcoal/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[88vh] flex-col">
        <header className="flex items-start gap-3 border-b border-border/70 bg-white px-6 py-5">
          <span
            aria-hidden
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border/60 bg-cream-warm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tapan.jpg"
              alt=""
              loading="lazy"
              decoding="async"
              sizes="44px"
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="tapan-note-modal-title"
              className="font-serif text-[18px] leading-tight text-charcoal"
            >
              A note from Tapan
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              Personal tips for your trip
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close note"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-warm text-charcoal-soft transition-colors hover:bg-border/70 hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {hasQuote ? (
            <blockquote className="relative pl-4">
              <span
                aria-hidden
                className="absolute left-0 top-1.5 h-6 w-1 rounded-full bg-terracotta"
              />
              <p className="font-serif text-[18px] italic leading-[1.55] text-charcoal sm:text-[19px]">
                {quote}
              </p>
            </blockquote>
          ) : null}

          {hasPrefs ? (
            <>
              {hasQuote ? (
                <hr className="my-6 border-border-strong/60" />
              ) : null}
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
                Noted for you
              </p>
              <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-charcoal-soft">
                {preferences}
              </p>
            </>
          ) : null}

          {!hasQuote && !hasPrefs ? (
            <p className="text-[14px] italic leading-relaxed text-muted">
              Tapan will share personal tips here before your trip begins.
            </p>
          ) : null}
        </div>

        {whatsapp ? (
          <footer className="border-t border-border/70 bg-white px-6 py-4">
            <Link
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-[12.5px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark"
            >
              <MessageCircle size={14} />
              Ask Tapan a follow-up
            </Link>
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------------------ */

function PhotoFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-green-dark via-brand-green to-charcoal">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(255,255,255,0.12),transparent_55%)]"
      />
      <MapPin
        size={32}
        strokeWidth={1.2}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-cream/50"
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */

/**
 * Derives a "Day N" or "Day N–M" label from the trip start and this
 * destination's arrival/departure. Returns null when the inputs can't
 * safely produce a positive-day label — callers can fall back to the
 * destination's own date range in that case.
 */
function dayLabelForDestination(
  planStart: string | null | undefined,
  arrival: string | null | undefined,
  departure: string | null | undefined,
  nights: number | null | undefined
): string | null {
  if (!planStart || !arrival) return null;
  const ps = new Date(planStart);
  const ar = new Date(arrival);
  if (Number.isNaN(ps.getTime()) || Number.isNaN(ar.getTime())) return null;
  const dayIn =
    Math.round((ar.getTime() - ps.getTime()) / 86_400_000) + 1;
  if (dayIn < 1) return null;
  let dayOut = dayIn;
  if (departure) {
    const de = new Date(departure);
    if (!Number.isNaN(de.getTime())) {
      dayOut =
        Math.round((de.getTime() - ps.getTime()) / 86_400_000) + 1;
    }
  } else if (nights != null && nights > 0) {
    dayOut = dayIn + nights;
  }
  if (dayOut > dayIn) return `Day ${dayIn}–${dayOut}`;
  return `Day ${dayIn}`;
}

/**
 * Builds a comma-separated, real-data summary of the trip's destinations.
 * Empty input → empty string; 1–3 destinations are joined by commas; 4+
 * collapses to "A, B, C and N more".
 */
function describeDestinations(
  destinations: DestinationWithCounts[]
): string {
  const names = destinations
    .map((d) => d.destination.name?.trim())
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return "";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
}
