"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, MapPin } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import {
  formatTripRange,
  formatDestinationRange,
  pluralizeNights,
  tripLengthDays,
  whatsappHref,
} from "@/lib/plan/format";
import type { DestinationWithCounts } from "@/lib/plan/customer-view";
import type { PlanWithCustomer } from "@/lib/plan/types";

/*
 * Trip Home — the first screen a traveler sees after unlocking. Should feel
 * personal, calm, and oriented: who the trip is for, when, where it goes, and
 * how to reach Tapan. Deliberately NOT a dump of every module. Deeper detail
 * lives one tap away on Journey / Destination Hub.
 *
 * Rendered as a client component so the motion primitives can co-locate here;
 * all data comes in as props from the server page.
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
  const name =
    (plan.customer?.name || plan.travelerName || "Your").split(" ")[0] ||
    "Your";
  const possessive = name === "Your" ? "Your" : `${name}'s`;
  const dateLine = formatTripRange(plan.startDate, plan.endDate);
  const days = tripLengthDays(plan.startDate, plan.endDate, plan.tripDays);
  const metaBits: string[] = [];
  if (days != null) metaBits.push(`${days} day${days === 1 ? "" : "s"}`);
  if (destinations.length)
    metaBits.push(
      `${destinations.length} destination${destinations.length === 1 ? "" : "s"}`
    );
  if (totalNights > 0 && !days)
    metaBits.push(`${totalNights} night${totalNights === 1 ? "" : "s"}`);
  const metaLine = metaBits.join(" · ");

  const heroImage = destinations.find((d) => d.destination.heroImageUrl)
    ?.destination.heroImageUrl;
  const introText = plan.subtitle;
  const whatsapp = whatsappHref(
    plan.whatsappContact,
    `Hi Tapan — I have a question about my trip (${plan.title})`
  );
  const upNext = destinations[0]?.destination;

  return (
    <div className="pb-4">
      <HeroBlock
        possessive={possessive}
        subtitle={plan.subtitle}
        dateLine={dateLine}
        metaLine={metaLine}
        heroImage={heroImage}
        whatsappHref={whatsapp}
      />

      {introText ? (
        <CinematicReveal y={16} className="mx-auto mt-8 max-w-2xl px-5 sm:px-6">
          <p className="prose-editorial font-serif text-[18px] italic text-charcoal-soft sm:text-[19px]">
            &ldquo;{introText}&rdquo;
          </p>
        </CinematicReveal>
      ) : null}

      {plan.specialPreferences ? (
        <CinematicReveal
          y={16}
          className="mx-auto mt-6 max-w-2xl px-5 sm:px-6"
        >
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal-soft">
            {plan.specialPreferences}
          </p>
        </CinematicReveal>
      ) : null}

      {destinations.length > 0 ? (
        <section
          aria-labelledby="trip-home-journey"
          className="mx-auto mt-14 max-w-2xl px-5 sm:px-6"
        >
          <CinematicReveal y={14} className="flex items-end justify-between">
            <h2
              id="trip-home-journey"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark"
            >
              Your journey
            </h2>
            <Link
              href={`/plan/${token}/journey`}
              className="text-[12px] font-medium text-charcoal-soft underline-offset-4 hover:text-brand-green hover:underline"
            >
              See full timeline →
            </Link>
          </CinematicReveal>

          <ul className="mt-5 space-y-3">
            {destinations.slice(0, 5).map((d, i) => (
              <CinematicReveal
                key={d.destination.id}
                y={10}
                delay={i * 0.04}
                className="block"
              >
                <DestinationQuickRow token={token} dc={d} index={i + 1} />
              </CinematicReveal>
            ))}
            {destinations.length > 5 ? (
              <li className="pt-1">
                <Link
                  href={`/plan/${token}/journey`}
                  className="text-sm font-medium text-brand-green-dark hover:underline"
                >
                  +{destinations.length - 5} more on the journey →
                </Link>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {upNext ? (
        <section
          aria-labelledby="trip-home-upnext"
          className="mx-auto mt-14 max-w-2xl px-5 sm:px-6"
        >
          <CinematicReveal y={14}>
            <h2
              id="trip-home-upnext"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark"
            >
              Up next
            </h2>
            <Link
              href={`/plan/${token}/destinations/${upNext.id}`}
              className="group mt-4 block overflow-hidden rounded-2xl border border-border bg-white"
            >
              <div className="relative aspect-[16/9] w-full bg-cream">
                {upNext.heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={upNext.heroImageUrl}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <PhotoFallback />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/40 via-charcoal/5 to-transparent" />
              </div>
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-serif text-xl text-charcoal">
                    {upNext.name}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    Your first stop starts here.
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-brand-green-dark transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </div>
            </Link>
          </CinematicReveal>
        </section>
      ) : null}

      <section
        aria-labelledby="trip-home-help"
        className="mx-auto mt-16 max-w-2xl px-5 sm:px-6"
      >
        <CinematicReveal y={14}>
          <h2
            id="trip-home-help"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark"
          >
            Need help?
          </h2>
          <div className="mt-4 rounded-2xl border border-border bg-white p-6">
            <p className="font-serif text-lg text-charcoal">Talk to Tapan</p>
            <p className="mt-1 text-[14px] text-charcoal-soft">
              Need help while planning or travelling? Message me on WhatsApp
              and I&apos;ll get back to you — this isn&apos;t a chatbot.
            </p>
            {whatsapp ? (
              <Link
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark"
              >
                <MessageCircle size={15} />
                WhatsApp Tapan
              </Link>
            ) : (
              <p className="mt-5 text-[12px] text-muted">
                Tapan will share his WhatsApp number here before you travel.
              </p>
            )}
          </div>
        </CinematicReveal>
      </section>
    </div>
  );
}

function HeroBlock({
  possessive,
  subtitle,
  dateLine,
  metaLine,
  heroImage,
  whatsappHref,
}: {
  possessive: string;
  subtitle: string;
  dateLine: string;
  metaLine: string;
  heroImage?: string;
  whatsappHref: string | null;
}) {
  return (
    <section className="relative">
      <CinematicReveal y={0} scale={1.02} duration={1} margin="0px">
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-charcoal sm:aspect-[16/9] lg:aspect-[21/9] lg:rounded-3xl">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt=""
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <PhotoFallback />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/10 via-charcoal/30 to-charcoal/80"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-cream-warm lg:hidden"
          />
        </div>
      </CinematicReveal>

      <div className="relative -mt-24 px-5 sm:px-6 lg:-mt-32 lg:px-10">
        <CinematicReveal y={18}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/90 drop-shadow-sm">
            Your India journey
          </p>
          <h1 className="mt-3 font-serif text-[34px] leading-[1.04] tracking-tight text-cream drop-shadow-sm sm:text-[42px] lg:text-[52px]">
            {possessive} journey through India
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-xl text-[14px] font-medium text-cream/90 drop-shadow-sm sm:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </CinematicReveal>

        <CinematicReveal y={14} delay={0.08}>
          <div className="mt-6 rounded-2xl border border-border bg-white/95 p-5 shadow-[0_14px_38px_rgba(20,30,25,0.12)] backdrop-blur lg:max-w-xl">
            {dateLine ? (
              <p className="font-serif text-[18px] text-charcoal sm:text-[19px]">
                {dateLine}
              </p>
            ) : null}
            {metaLine ? (
              <p className="mt-1 text-[13px] text-muted">{metaLine}</p>
            ) : null}
            {whatsappHref ? (
              <Link
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark"
              >
                <MessageCircle size={15} />
                Chat with Tapan
              </Link>
            ) : null}
          </div>
        </CinematicReveal>

        <div className="h-6 sm:h-10 lg:h-16" />
      </div>
    </section>
  );
}

function DestinationQuickRow({
  token,
  dc,
  index,
}: {
  token: string;
  dc: DestinationWithCounts;
  index: number;
}) {
  const d = dc.destination;
  const range = formatDestinationRange(d.arrivalDate, d.departureDate);
  const nights = pluralizeNights(d.nights);
  return (
    <Link
      href={`/plan/${token}/destinations/${d.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-green/50 sm:p-5"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-warm text-[12px] font-semibold text-brand-green-dark sm:h-11 sm:w-11"
      >
        {String(index).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[18px] leading-tight text-charcoal sm:text-[19px]">
          {d.name}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
          {range ? <span>{range}</span> : null}
          {range && nights ? <span aria-hidden>·</span> : null}
          {nights ? <span>{nights}</span> : null}
        </span>
      </span>
      <ArrowRight
        size={16}
        className="shrink-0 text-brand-green-dark opacity-70 transition-transform group-hover:translate-x-1 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      />
    </Link>
  );
}

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
