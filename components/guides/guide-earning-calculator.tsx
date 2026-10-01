"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import {
  CALCULATOR_DEFAULT_GUESTS,
  CALCULATOR_MAX_GUESTS,
  CALCULATOR_MIN_GUESTS,
  ILLUSTRATIVE_RATE_PER_GUEST_INR,
} from "@/lib/guides";

// Animates between the previous and next target in requestAnimationFrame.
// Instant on reduced-motion. Starts the next tween from whatever the slider
// was mid-animation on, so rapid drags look fluid instead of resetting.
function useTween(target: number, reduced: boolean, duration = 500): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const from = valueRef.current;
    const to = target;
    if (from === to) return;
    const t0 = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const v = Math.round(from + (to - from) * easeOut(t));
      valueRef.current = v;
      setValue(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, reduced, duration]);

  return reduced ? target : value;
}

function formatInr(n: number): string {
  return n.toLocaleString("en-IN");
}

export function GuideEarningCalculator() {
  const reduced = useReducedMotion() ?? false;
  const [guests, setGuests] = useState<number>(CALCULATOR_DEFAULT_GUESTS);
  const target = guests * ILLUSTRATIVE_RATE_PER_GUEST_INR;
  const displayed = useTween(target, reduced);

  const trackPct =
    ((guests - CALCULATOR_MIN_GUESTS) /
      (CALCULATOR_MAX_GUESTS - CALCULATOR_MIN_GUESTS)) *
    100;

  return (
    <Section tone="white" className="border-y border-border">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Estimated earnings</SectionEyebrow>
          <SectionHeading className="mt-3">
            See what a guide can earn.
          </SectionHeading>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            Illustrative only. Actual payment is agreed per assignment based on
            scope, destination, duration and the rate we settle on together.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl rounded-3xl border border-border bg-cream-warm/50 p-7 sm:p-10">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
              Estimated earnings
            </p>
            <p className="text-[11px] text-muted">
              Example rate: ₹{formatInr(ILLUSTRATIVE_RATE_PER_GUEST_INR)} / guest
            </p>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <motion.span
              key={target}
              initial={
                reduced ? false : { opacity: 0.6, filter: "blur(2px)" }
              }
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.35 }}
              className="font-serif text-[56px] leading-none tracking-tight text-charcoal sm:text-[72px] lg:text-[88px]"
            >
              ₹{formatInr(displayed)}
            </motion.span>
            <span className="pb-2 text-[13px] text-muted">per day</span>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between text-[13px] text-charcoal-soft">
              <span>
                <span className="font-semibold text-charcoal">{guests}</span>{" "}
                {guests === 1 ? "guest" : "guests"}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Group size
              </span>
            </div>

            <div className="relative mt-3">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1/2 h-[6px] w-full -translate-y-1/2 rounded-full bg-border/70"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-1/2 h-[6px] -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-green to-brand-green-dark transition-[width] duration-150"
                style={{ width: `${trackPct}%` }}
              />
              <input
                type="range"
                min={CALCULATOR_MIN_GUESTS}
                max={CALCULATOR_MAX_GUESTS}
                step={1}
                value={guests}
                onChange={(e) => setGuests(Number(e.currentTarget.value))}
                aria-label="Group size"
                aria-valuemin={CALCULATOR_MIN_GUESTS}
                aria-valuemax={CALCULATOR_MAX_GUESTS}
                aria-valuenow={guests}
                className="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent focus:outline-none [&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-green [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_6px_16px_rgba(29,158,117,0.35)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110 [&::-moz-range-track]:h-[6px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand-green [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_6px_16px_rgba(29,158,117,0.35)] focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-brand-green/40"
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted">
              <span>{CALCULATOR_MIN_GUESTS}</span>
              <span>{CALCULATOR_MAX_GUESTS}</span>
            </div>
          </div>

          <p className="mt-8 text-[12px] italic leading-relaxed text-muted">
            Illustrative example only. StayLocal does not guarantee a daily
            rate, booking volume or minimum income. Each assignment is scoped
            and quoted individually.
          </p>
        </div>
      </Container>
    </Section>
  );
}
