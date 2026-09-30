"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
  SectionLede,
} from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { extractState, type Experience } from "@/lib/experiences";

const EASE = [0.22, 1, 0.36, 1] as const;

// Auto-drift tuning. Slow enough to feel cinematic — a viewer parked on the
// section watches the rail *move*, not scroll.
const AUTO_SPEED_PX_PER_SEC = 34;
const RESUME_AFTER_MS = 2500;
const WRAP_PAUSE_MS = 1800;

const MOBILE_MQ = "(max-width: 767px)";
const subscribeMq = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getMqSnapshot = () => window.matchMedia(MOBILE_MQ).matches;
const getMqServerSnapshot = () => false;

export function ExperiencesRail({
  experiences,
}: {
  experiences: Experience[];
}) {
  const reduced = useReducedMotion();
  const isMobile = useSyncExternalStore(
    subscribeMq,
    getMqSnapshot,
    getMqServerSnapshot,
  );

  const scrollRef = useRef<HTMLUListElement | null>(null);
  const firstCardRef = useRef<HTMLLIElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  // Track edge-of-rail state for the desktop arrows. Deferred to RAF so the
  // initial measurement runs off the render path.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft < max - 4);
    };
    const raf = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  // Auto-drift on mobile only. Pauses on any user interaction and resumes
  // after a short quiet period. Never runs when the user prefers reduced
  // motion. Never fights an active drag — we only touch scrollLeft when
  // `paused` is false, and pause fires on `touchstart` before the drag starts.
  useEffect(() => {
    if (reduced) return;
    if (!isMobile) return;
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    let last = performance.now();
    let paused = false;
    let resumeTimer: number | null = null;
    let wrapTimer: number | null = null;

    const clearResume = () => {
      if (resumeTimer !== null) {
        window.clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };

    const step = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          const nextLeft = el.scrollLeft + (AUTO_SPEED_PX_PER_SEC * dt) / 1000;
          if (nextLeft >= max - 1) {
            // Reached the end — smooth-scroll back to the start, pause during
            // the ride so the drift doesn't accumulate on top of it.
            paused = true;
            el.scrollTo({ left: 0, behavior: "smooth" });
            wrapTimer = window.setTimeout(() => {
              paused = false;
              wrapTimer = null;
            }, WRAP_PAUSE_MS);
          } else {
            el.scrollLeft = nextLeft;
          }
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const pauseAndResume = () => {
      paused = true;
      clearResume();
      resumeTimer = window.setTimeout(() => {
        paused = false;
        resumeTimer = null;
      }, RESUME_AFTER_MS);
    };

    el.addEventListener("touchstart", pauseAndResume, { passive: true });
    el.addEventListener("pointerdown", pauseAndResume);
    el.addEventListener("focusin", pauseAndResume);

    return () => {
      cancelAnimationFrame(raf);
      clearResume();
      if (wrapTimer !== null) window.clearTimeout(wrapTimer);
      el.removeEventListener("touchstart", pauseAndResume);
      el.removeEventListener("pointerdown", pauseAndResume);
      el.removeEventListener("focusin", pauseAndResume);
    };
  }, [reduced, isMobile]);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const first = firstCardRef.current;
    // Prefer the actual first-card width + a nominal gap; fall back to 80% of
    // the rail's client width if we can't measure a card yet.
    const step =
      first !== null ? first.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  const container: Variants = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
      };

  const item: Variants = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      };

  return (
    <Section tone="warm">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="max-w-2xl">
            <SectionEyebrow>First-hand experiences</SectionEyebrow>
            <SectionHeading className="mt-3">
              Places I&apos;ve been. Notes I&apos;d give a friend.
            </SectionHeading>
            <SectionLede>
              Real trips, honest notes — what to do, what to skip, what to
              avoid, and what most travel blogs won&apos;t tell you.
            </SectionLede>
          </div>

          {/* Desktop rail controls — subtle, right-aligned near the heading */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <RailButton
              direction="prev"
              onClick={() => scrollByCard(-1)}
              disabled={!canPrev}
            />
            <RailButton
              direction="next"
              onClick={() => scrollByCard(1)}
              disabled={!canNext}
            />
          </div>
        </div>
      </Container>

      {/* Full-bleed rail. Inline padding mirrors Container's so the first
          card aligns with heading content on typical viewports; the last card
          naturally peeks in from the right, signalling "there's more". */}
      <motion.div
        className="mt-12 lg:mt-14"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px 0px" }}
      >
        <ul
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-2 pl-5 pr-5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pl-7 sm:pr-7 lg:gap-6 lg:pl-10 lg:pr-10"
          aria-label="First-hand experiences"
        >
          {experiences.map((e, i) => (
            <li
              key={e.slug}
              ref={i === 0 ? firstCardRef : undefined}
              className="w-[82vw] shrink-0 snap-start sm:w-[340px] lg:w-[360px] xl:w-[380px]"
            >
              <motion.div variants={item} className="h-full">
                <ExperienceRailCard experience={e} priority={i < 3} />
              </motion.div>
            </li>
          ))}
        </ul>
      </motion.div>

      <Container className="mt-12 lg:mt-14">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button asChild variant="primary" size="lg" className="sm:min-w-64">
            <Link href="/experiences" prefetch className="group">
              Browse all experiences
              <ArrowRight
                size={16}
                className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function RailButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        direction === "prev"
          ? "Previous experiences"
          : "Next experiences"
      }
      className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-charcoal transition-all hover:border-brand-green/40 hover:text-brand-green hover:shadow-[0_8px_24px_rgba(20,30,25,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream-warm disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-charcoal disabled:hover:shadow-none"
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  );
}

function ExperienceRailCard({
  experience,
  priority = false,
}: {
  experience: Experience;
  priority?: boolean;
}) {
  const image = experience.image ?? experience.heroImage;
  const state = extractState(experience.place) || experience.place;
  const destination =
    experience.place.split(",")[0]?.trim() || experience.title;

  return (
    <Link
      href={`/experiences/${experience.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-charcoal shadow-[0_10px_30px_rgba(20,30,25,0.05)] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(20,30,25,0.12)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream-warm motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-warm">
        {image ? (
          <Image
            src={image}
            alt={`${destination}, ${state}`}
            fill
            sizes="(min-width: 1280px) 380px, (min-width: 1024px) 360px, (min-width: 640px) 340px, 82vw"
            className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center bg-brand-green-light/40 text-brand-green-dark">
            <span className="font-serif text-2xl">{destination}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 lg:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
          {state}
        </p>
        <p className="mt-2 font-serif text-[22px] leading-tight text-charcoal lg:text-[24px]">
          {destination}
        </p>
        {experience.shortDesc && (
          <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-charcoal-soft">
            {experience.shortDesc}
          </p>
        )}
        <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green transition-colors group-hover:text-brand-green-dark">
          Read experience
          <ArrowRight
            size={12}
            className="transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
        </p>
      </div>
    </Link>
  );
}
