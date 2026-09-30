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

const EASE = [0.22, 1, 0.36, 1] as const;

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

      {/* --------- STEP CARDS (FIRST) --------- */}

      <Container>
        {/* Progress indicator (desktop) */}
        <div
          className="mt-14 hidden md:flex md:items-center md:gap-3 lg:mt-20"
          role="tablist"
          aria-label="Steps"
        >
          {steps.map((s, i) => {
            const isActive = active === i;
            return (
              <button
                key={s.n}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`step-panel-${s.n}`}
                id={`step-tab-${s.n}`}
                onClick={() => setActive(i)}
                className="group flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-4 focus-visible:ring-offset-cream-warm rounded-full"
              >
                <span
                  className={
                    "h-[3px] rounded-full transition-all duration-500 " +
                    (isActive
                      ? "w-10 bg-brand-green"
                      : "w-6 bg-charcoal/15 group-hover:bg-charcoal/30")
                  }
                />
                <span
                  className={
                    "text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors " +
                    (isActive ? "text-brand-green-dark" : "text-charcoal/50")
                  }
                >
                  {s.n}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop step grid */}
        <div className="mt-8 hidden gap-5 md:grid md:grid-cols-3 lg:mt-10 lg:gap-6">
          {steps.map((s, i) => (
            <StepCard
              key={s.n}
              step={s}
              active={active === i}
              onActivate={() => setActive(i)}
              reduced={!!reduced}
            />
          ))}
        </div>
      </Container>

      {/* Mobile horizontal snap scroller for steps */}
      <div className="mt-12 md:hidden">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li aria-hidden className="w-4 shrink-0 sm:w-6" />
          {steps.map((s, i) => (
            <li key={s.n} className="w-[86vw] shrink-0 snap-start">
              <StepCard
                step={s}
                active={active === i}
                onActivate={() => setActive(i)}
                reduced={!!reduced}
                mobile
              />
            </li>
          ))}
          <li aria-hidden className="w-4 shrink-0 sm:w-6" />
        </ul>
        <Container className="mt-4">
          <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
            <span className="h-px w-6 bg-muted/60" />
            Swipe through the steps
          </p>
        </Container>
      </div>

      {/* --------- PRICING PREVIEW (THEN) --------- */}

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

// ---------- Step card ----------

function StepCard({
  step,
  active,
  onActivate,
  reduced,
  mobile = false,
}: {
  step: Step;
  active: boolean;
  onActivate: () => void;
  reduced: boolean;
  mobile?: boolean;
}) {
  const bulletsVisible = mobile || reduced || active;

  return (
    <motion.div
      onMouseEnter={reduced || mobile ? undefined : onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      role="tabpanel"
      id={`step-panel-${step.n}`}
      aria-labelledby={`step-tab-${step.n}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      className={
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream-warm lg:p-7 " +
        (active
          ? "border-brand-green/25 bg-gradient-to-br from-brand-green/[0.08] via-cream to-brand-green-light/50 shadow-[0_20px_60px_rgba(29,158,117,0.14)]"
          : "border-border bg-card/70 shadow-[0_8px_24px_rgba(20,30,25,0.04)]")
      }
      animate={
        reduced
          ? { scale: 1, opacity: 1, y: 0 }
          : {
              scale: mobile ? 1 : active ? 1 : 0.985,
              opacity: mobile ? 1 : active ? 1 : 0.78,
              y: !mobile && active ? -4 : 0,
            }
      }
      transition={{ duration: 0.5, ease: EASE }}
    >
      {active && !reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl bg-[radial-gradient(80%_100%_at_20%_0%,rgba(29,158,117,0.16),transparent_60%)]"
        />
      )}

      <div className="relative flex flex-1 flex-col">
        <motion.p
          className="font-serif text-[64px] leading-none tracking-tight lg:text-[72px]"
          animate={reduced ? { y: 0 } : { y: !mobile && active ? -2 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{
            color: active
              ? "var(--color-brand-green-dark)"
              : "rgba(20, 30, 25, 0.22)",
            transition: "color 500ms",
          }}
        >
          {step.n}
        </motion.p>

        <p className="mt-4 font-serif text-xl leading-tight text-charcoal lg:text-[22px]">
          {step.title}
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-charcoal-soft">
          {step.lead}
        </p>

        <motion.ul
          className="mt-5 space-y-2"
          animate={
            reduced
              ? { opacity: 1, y: 0 }
              : { opacity: bulletsVisible ? 1 : 0, y: bulletsVisible ? 0 : 8 }
          }
          transition={{ duration: 0.4, ease: EASE }}
          aria-hidden={bulletsVisible ? undefined : "true"}
        >
          {step.bullets.map((b) => (
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
        </motion.ul>

        <div className="mt-auto border-t border-brand-green/15 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
            You get
          </p>
          <p className="mt-1 font-serif text-lg leading-tight text-charcoal">
            {step.outcome}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
