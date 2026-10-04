"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { primaryCta } from "@/lib/site";
import { services, type ServiceTier } from "@/lib/services";
import { useSectionProgress, EASE } from "@/components/site/motion-primitives";

// ---------- Types ----------

type Step = {
  n: string;
  title: string;
  lead: string;
  bullets: readonly string[];
  outcome: string;
};

type Plan = {
  n: string;
  title: string;
  base: number;
  rangeSuffix?: string;
  lead: string;
  bullets: readonly string[];
  note?: string;
  gradient: string;
};

// Presentation-only copy for the pricing preview cards. Price, title and
// priceNote are pulled from `services` in lib/services.ts to keep this page
// in lockstep with the canonical service data.
type PlanPresentation = {
  serviceId: ServiceTier["id"];
  n: string;
  lead: string;
  bullets: readonly string[];
  gradient: string;
};

function priceParts(service: ServiceTier): { base: number; rangeSuffix?: string } {
  const base =
    typeof service.priceUsd === "number"
      ? service.priceUsd
      : parseInt(String(service.priceUsd).replace(/[^0-9]/g, ""), 10);
  const basePrefix = `$${base.toLocaleString("en-US")}`;
  const suffix =
    service.price.startsWith(basePrefix) && service.price.length > basePrefix.length
      ? service.price.slice(basePrefix.length)
      : undefined;
  return { base, rangeSuffix: suffix };
}

function buildPlan(p: PlanPresentation): Plan {
  const service = services.find((s) => s.id === p.serviceId);
  if (!service) {
    throw new Error(`IndependentTravel: unknown service id "${p.serviceId}"`);
  }
  const { base, rangeSuffix } = priceParts(service);
  return {
    n: p.n,
    title: service.name,
    base,
    rangeSuffix,
    lead: p.lead,
    bullets: p.bullets,
    note: service.priceNote,
    gradient: p.gradient,
  };
}

// ---------- Content ----------

const steps: readonly Step[] = [
  {
    n: "01",
    title: "Tell us what you want",
    lead: "You don't need to know how to plan India. Tell us your dates, interests, budget and travel style.",
    bullets: [
      "Destination ideas",
      "What fits your travel style",
      "What is realistic for your time",
    ],
    outcome: "A clear direction.",
  },
  {
    n: "02",
    title: "We make India make sense",
    lead: "We turn your ideas into a realistic route — destinations, transport, pacing and what is actually worth your time.",
    bullets: [
      "Practical route planning",
      "Local perspective",
      "Things to skip",
      "Better use of your time",
    ],
    outcome: "A plan that makes sense.",
  },
  {
    n: "03",
    title: "You travel your way",
    lead: "You remain in control. Book independently, move at your own pace, and use StayLocal when you need help.",
    bullets: [
      "WhatsApp support",
      "Local recommendations",
      "Help navigating unfamiliar situations",
      "Trusted local help when required",
    ],
    outcome: "Freedom with a safety net.",
  },
] as const;

const planCopy: readonly PlanPresentation[] = [
  {
    serviceId: "plan",
    n: "01",
    lead: "A personalized India itinerary built around you.",
    bullets: [
      "Personalized itinerary",
      "Practical route & destination advice",
      "Local knowledge",
      "WhatsApp support throughout",
    ],
    gradient:
      "bg-gradient-to-br from-cream via-cream-warm to-brand-green-light/50",
  },
  {
    serviceId: "local-help",
    n: "02",
    lead: "Your personal India plan, with a trusted local guide when you want one.",
    bullets: [
      "Everything in Your India Plan",
      "Personal local guide",
      "Local navigation & recommendations",
      "Help with translation and local experiences",
    ],
    gradient:
      "bg-gradient-to-br from-brand-green-light/70 via-cream-warm to-brand-green-light/40",
  },
  {
    serviceId: "curated",
    n: "03",
    lead: "A complete India journey planned and organized for you.",
    bullets: [
      "Complete itinerary planning",
      "Stays & transport",
      "Experiences & activities",
      "Guides and local arrangements",
      "Booking coordination & ongoing support",
    ],
    gradient:
      "bg-gradient-to-br from-brand-green/[0.12] via-brand-green-light/60 to-cream-warm",
  },
] as const;

const plans: readonly Plan[] = planCopy.map(buildPlan);

// ---------- Section ----------

export function IndependentTravel() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <Section tone="warm" className="overflow-hidden">
      <Container>
        {/* Headline block */}
        <div className="max-w-3xl">
          <SectionEyebrow>Travel your way</SectionEyebrow>
          <SectionHeading className="mt-3">
            You don&apos;t need a tour.
            <br />
            <span className="italic text-brand-green-dark">
              You need the right help.
            </span>
          </SectionHeading>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Travel India independently, with local knowledge and someone you
            can turn to when things get confusing.
          </p>
        </div>
      </Container>

      {/* --------- SCROLL-DRIVEN TIMELINE --------- */}

      <Container>
        <Timeline
          steps={steps}
          active={active}
          onActivate={setActive}
          reduced={!!reduced}
        />
      </Container>

      {/* --------- PRICING PREVIEW --------- */}

      <PricingPreview reduced={!!reduced} />

      {/* --------- BOTTOM STATEMENT --------- */}

      <Container className="mt-20 lg:mt-28">
        <div className="max-w-3xl">
          <p className="font-serif text-3xl leading-[1.1] tracking-tight text-charcoal sm:text-4xl lg:text-[52px]">
            You keep the freedom.
            <br />
            <span className="text-brand-green-dark">
              We handle the friction.
            </span>
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            You don&apos;t have to hand your entire trip over to a tour
            operator to get local help.
          </p>
          <div className="mt-7">
            <Button asChild variant="primary" size="lg">
              <Link href={primaryCta.href} prefetch className="group">
                Talk to an India Expert — $10
                <ArrowRight
                  size={16}
                  className="ml-0.5 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ---------- Timeline ----------
// Scroll-driven vertical sequence. A single vertical rail runs through the
// whole list; the green fill scales with section scroll progress. Each row
// has its own IntersectionObserver so the active node + big number can
// highlight as the step reaches the viewport midband.
//
// Mobile uses the same layout at a tighter density — no horizontal scroller,
// no scroll hijacking.

function Timeline({
  steps,
  active,
  onActivate,
  reduced,
}: {
  steps: readonly Step[];
  active: number;
  onActivate: (i: number) => void;
  reduced: boolean;
}) {
  const timelineRef = useRef<HTMLOListElement | null>(null);
  const progress = useSectionProgress(timelineRef, ["start 70%", "end 60%"]);

  return (
    <ol
      ref={timelineRef}
      className="relative mt-12 pl-10 sm:mt-16 sm:pl-14 lg:mt-20 lg:pl-20"
      aria-label="How StayLocal works"
    >
      {/* Rail — neutral backdrop */}
      <div
        aria-hidden
        className="absolute left-[14px] top-3 bottom-3 w-px bg-charcoal/15 sm:left-[20px] lg:left-[26px]"
      />
      {/* Rail — green fill, scaleY tied to section progress */}
      <motion.div
        aria-hidden
        className="absolute left-[14px] top-3 bottom-3 w-px origin-top bg-brand-green sm:left-[20px] lg:left-[26px]"
        style={reduced ? { scaleY: 0 } : { scaleY: progress }}
      />

      {steps.map((s, i) => (
        <TimelineRow
          key={s.n}
          step={s}
          index={i}
          active={active === i}
          onActivate={() => onActivate(i)}
          reduced={reduced}
          isLast={i === steps.length - 1}
        />
      ))}
    </ol>
  );
}

function TimelineRow({
  step,
  index,
  active,
  onActivate,
  reduced,
  isLast,
}: {
  step: Step;
  index: number;
  active: boolean;
  onActivate: () => void;
  reduced: boolean;
  isLast: boolean;
}) {
  const rowRef = useRef<HTMLLIElement | null>(null);

  // Keep onActivate in a ref so the IO effect subscribes once per mount
  // instead of re-subscribing on every parent re-render (active state
  // changes re-render Timeline → new closure per row).
  const onActivateRef = useRef(onActivate);
  useEffect(() => {
    onActivateRef.current = onActivate;
  }, [onActivate]);

  // Activates the row when its midpoint sits in the viewport midband.
  // `rootMargin: -40% top / -40% bottom` means the row has to be within the
  // middle 20% of the viewport to count as "active" — gives one clear
  // active step at a time instead of flickering between neighbours.
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onActivateRef.current();
            return;
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <li
      ref={rowRef}
      id={`step-${step.n}`}
      className={isLast ? "" : "pb-14 lg:pb-20"}
    >
      {/* Node — sits on top of the rail at this row's top */}
      <motion.span
        aria-hidden
        className="absolute -ml-[21px] mt-[2px] block h-[18px] w-[18px] rounded-full border-2 border-charcoal/25 bg-cream-warm sm:-ml-[27px] sm:h-[22px] sm:w-[22px] lg:-ml-[33px] lg:h-[26px] lg:w-[26px]"
        animate={
          reduced
            ? undefined
            : {
                borderColor: active
                  ? "rgba(16, 122, 86, 0.95)"
                  : "rgba(20, 30, 25, 0.25)",
                scale: active ? 1.08 : 1,
              }
        }
        transition={{ duration: 0.55, ease: EASE }}
      >
        <motion.span
          className="absolute inset-[3px] block rounded-full bg-brand-green sm:inset-[4px] lg:inset-[5px]"
          animate={
            reduced
              ? undefined
              : { opacity: active ? 1 : 0, scale: active ? 1 : 0.6 }
          }
          transition={{ duration: 0.55, ease: EASE }}
        />
      </motion.span>

      {/* Big step number */}
      <motion.p
        className="font-serif text-[44px] leading-none tracking-tight sm:text-[56px] lg:text-[72px]"
        animate={
          reduced
            ? { color: "rgba(20, 30, 25, 0.22)" }
            : {
                color: active
                  ? "var(--color-brand-green-dark)"
                  : "rgba(20, 30, 25, 0.22)",
              }
        }
        transition={{ duration: 0.6, ease: EASE }}
      >
        {step.n}
      </motion.p>

      {/* Card content — reveals on viewport entry, settles after */}
      <motion.article
        onMouseEnter={reduced ? undefined : onActivate}
        onFocus={onActivate}
        tabIndex={0}
        className="relative mt-4 overflow-hidden rounded-3xl border border-brand-green/15 bg-card p-6 shadow-[0_10px_30px_rgba(20,30,25,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream-warm sm:p-7 lg:p-8"
        initial={reduced ? false : { opacity: 0, y: 36, scale: 0.985 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        transition={{ duration: 0.9, ease: EASE }}
        animate={
          reduced
            ? undefined
            : {
                boxShadow: active
                  ? "0 24px 60px rgba(29,158,117,0.14)"
                  : "0 10px 30px rgba(20,30,25,0.05)",
                borderColor: active
                  ? "rgba(29,158,117,0.3)"
                  : "rgba(29,158,117,0.15)",
              }
        }
      >
        {/* Soft green glow when active */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl bg-[radial-gradient(80%_100%_at_20%_0%,rgba(29,158,117,0.16),transparent_60%)]"
          animate={reduced ? undefined : { opacity: active ? 1 : 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        />

        <div className="relative flex flex-col">
          <p className="font-serif text-xl leading-tight text-charcoal lg:text-[22px]">
            {step.title}
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-charcoal-soft lg:text-[15px]">
            {step.lead}
          </p>

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {step.bullets.map((b, bi) => (
              <motion.li
                key={b}
                className="flex items-start gap-2 text-[13px] leading-snug text-charcoal-soft"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{
                  duration: 0.5,
                  ease: EASE,
                  delay: reduced ? 0 : 0.1 + bi * 0.05,
                }}
              >
                <Check
                  size={13}
                  strokeWidth={2.5}
                  className="mt-[3px] shrink-0 text-brand-green"
                />
                <span>{b}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-6 border-t border-brand-green/15 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
              You get
            </p>
            <p className="mt-1 font-serif text-lg leading-tight text-charcoal">
              {step.outcome}
            </p>
          </div>
        </div>

        {/* Hidden focus target for keyboard users (equivalent of the old tab)  */}
        <span className="sr-only">
          Step {step.n} of {steps.length} — {step.title}
        </span>
        {/* `index` is referenced here so TS keeps the prop in-scope; it's used
            for keyboard order/semantics via the DOM order of the ol. */}
        <span data-step-index={index} className="hidden" />
      </motion.article>
    </li>
  );
}

// ---------- Pricing preview ----------
// Pure layout. Each PlanCard owns its own IntersectionObserver so count-up
// fires when *that* card enters the viewport (desktop) or becomes the active
// swipe card (mobile), not when the section as a whole scrolls into view.

function PricingPreview({ reduced }: { reduced: boolean }) {
  return (
    <div className="mt-20 lg:mt-28">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow text-brand-green-dark">
            Choose your level of help
          </p>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">
            From a clear personal plan to a completely organized India journey.
          </p>
        </div>

        {/* Desktop grid */}
        <div className="mt-8 hidden gap-5 md:grid md:grid-cols-3 lg:mt-10 lg:gap-6">
          {plans.map((p) => (
            <PlanCard key={p.n} plan={p} reduced={reduced} />
          ))}
        </div>
      </Container>

      {/* Mobile horizontal snap scroller */}
      <div className="mt-8 md:hidden">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li aria-hidden className="w-4 shrink-0 sm:w-6" />
          {plans.map((p) => (
            <li key={p.n} className="w-[86vw] shrink-0 snap-start">
              <PlanCard plan={p} reduced={reduced} />
            </li>
          ))}
          <li aria-hidden className="w-4 shrink-0 sm:w-6" />
        </ul>
        <Container className="mt-4">
          <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
            <span className="h-px w-6 bg-muted/60" />
            Swipe to compare
          </p>
        </Container>
      </div>
    </div>
  );
}

// ---------- Count-up hook ----------

function useCountUp(
  target: number,
  start: boolean,
  opts: { duration?: number; instant?: boolean } = {},
): number {
  const duration = opts.duration ?? 1800;
  const instant = !!opts.instant;
  const [value, setValue] = useState(instant ? target : 0);

  useEffect(() => {
    if (instant) return;
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setValue(Math.round(target * easeOut(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration, instant]);

  return instant ? target : value;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// ---------- Plan card ----------
// Owns its own IntersectionObserver. Fires once per page visit at the
// threshold below — high enough that horizontal snap positions cleanly trigger
// only the currently-visible mobile card, not neighbours partially exposed.

function PlanCard({ plan, reduced }: { plan: Plan; reduced: boolean }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [observed, setObserved] = useState(false);
  const visible = reduced || observed;

  useEffect(() => {
    if (reduced || observed) return;
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setObserved(true);
            io.disconnect();
            return;
          }
        }
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, observed]);

  const value = useCountUp(plan.base, visible, {
    instant: reduced,
    duration: plan.base >= 1000 ? 2200 : 1800,
  });
  const complete = reduced || value >= plan.base;

  return (
    <motion.div
      ref={outerRef}
      className="h-full"
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={
        reduced ? undefined : { opacity: visible ? 1 : 0, y: visible ? 0 : 24 }
      }
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div
        className={
          "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-green/15 p-6 shadow-[0_10px_30px_rgba(20,30,25,0.06)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(29,158,117,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:p-7 " +
          plan.gradient
        }
      >
        {/* Soft green glow on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl bg-[radial-gradient(80%_90%_at_20%_0%,rgba(29,158,117,0.14),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        <div className="relative flex flex-1 flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
            {plan.n} · Plan
          </p>

          <p className="mt-4 font-serif text-[22px] leading-tight text-charcoal lg:text-2xl">
            {plan.title}
          </p>

          {/* Price with count-up */}
          <div className="mt-5 flex items-baseline">
            <motion.span
              className="font-serif text-[44px] leading-none tracking-tight text-charcoal lg:text-[52px]"
              animate={
                reduced ? undefined : { opacity: complete ? 1 : 0.94 }
              }
              transition={{ duration: 0.4, ease: EASE }}
            >
              ${fmt(value)}
            </motion.span>
            {plan.rangeSuffix && (
              <motion.span
                className="ml-0.5 font-serif text-[28px] leading-none tracking-tight text-charcoal/70 lg:text-4xl"
                initial={reduced ? false : { opacity: 0, x: -6 }}
                animate={
                  complete ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }
                }
                transition={{
                  duration: 0.5,
                  ease: EASE,
                  delay: reduced ? 0 : 0.15,
                }}
              >
                {plan.rangeSuffix}
              </motion.span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-charcoal-soft">
            {plan.lead}
          </p>

          <ul className="mt-5 space-y-2">
            {plan.bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-[13px] leading-snug text-charcoal-soft"
              >
                <Check
                  size={13}
                  strokeWidth={2.5}
                  className="mt-[3px] shrink-0 text-brand-green"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {plan.note && (
            <p className="mt-5 text-[11px] italic leading-relaxed text-muted">
              {plan.note}
            </p>
          )}

          <div className="mt-auto" />
        </div>
      </div>
    </motion.div>
  );
}
