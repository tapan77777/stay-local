"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Pause,
  Play,
  UtensilsCrossed,
} from "lucide-react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/services";
import { cn } from "@/lib/utils";

/*
 * PlanShowcase — animated preview of a $150 "Your India Plan". A single
 * phone-shaped frame crossfades between six full-screen reference images
 * (one per view). Autoplays, pauses on interaction, respects
 * prefers-reduced-motion.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const AUTO_ADVANCE_MS = 1500;

type ViewId =
  | "overview"
  | "itinerary"
  | "places"
  | "map"
  | "stays"
  | "notes";

const VIEWS: ReadonlyArray<{ id: ViewId; label: string; icon: typeof Compass }> = [
  { id: "overview", label: "Trip", icon: Compass },
  { id: "itinerary", label: "Days", icon: Calendar },
  { id: "places", label: "Places", icon: MapPin },
  { id: "map", label: "Map", icon: Compass },
  { id: "stays", label: "Stays & food", icon: UtensilsCrossed },
  { id: "notes", label: "Tapan's notes", icon: BookOpen },
] as const;

// Resolve the plan service CTA from the canonical services registry so the
// label and URL stay in lockstep with the pricing source of truth.
const planService = services.find((s) => s.id === "plan");
const planCta = {
  label: planService?.ctaLabel ?? "Get Your India Plan — $150",
  href: planService?.ctaHref ?? "/consultation?service=plan",
};

// Single source of truth for the six slide images — one per view. Drop a
// replacement file at the listed path and the matching screen picks it up
// with no code change. `fallback` is served until the real asset is in
// place; `HeroImage` handles the client-side swap on 404.
const SHOWCASE_IMAGES: Record<
  ViewId,
  { primary: string; fallback: string; alt: string }
> = {
  overview: {
    primary: "/images/plan-showcase/overview-reference.png",
    fallback: "/images/travel-styles/culture.jpg",
    alt: "Sample India trip — editorial overview",
  },
  itinerary: {
    primary: "/images/plan-showcase/itinerary.png",
    fallback: "/images/travel-styles/local-life.jpg",
    alt: "Day-by-day itinerary preview",
  },
  places: {
    primary: "/images/plan-showcase/places.png",
    fallback: "/images/travel-styles/culture.jpg",
    alt: "Hand-picked places chosen for your trip",
  },
  map: {
    primary: "/images/plan-showcase/map.png",
    fallback: "/images/travel-styles/mountains.jpg",
    alt: "Trip route mapped across North India",
  },
  stays: {
    primary: "/images/plan-showcase/stays-food.png",
    fallback: "/images/travel-styles/food.jpg",
    alt: "Hand-picked stays and food",
  },
  notes: {
    primary: "/images/plan-showcase/notes-guide.png",
    fallback: "/images/travel-styles/comfort.jpg",
    alt: "Tapan's notes and India guide",
  },
};

export function PlanShowcase() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Playback state is split into three independent signals so the three kinds
  // of "stop autoplay" don't bleed into each other:
  //   - `userPaused`  → explicit toggle from the play/pause button.
  //                     Persists until the visitor presses play again.
  //   - `hovering`    → the visitor is actively interacting (hover / focus).
  //                     Resumes automatically when the pointer leaves.
  //   - `inView`      → section is in the viewport.
  //   - `pageVisible` → the browser tab is foregrounded.
  // Manual tab/arrow/swipe selection does NOT set any of these — it just
  // changes `index`, which naturally resets the autoplay timer below.
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const total = VIEWS.length;
  const current = VIEWS[index];
  const autoplay =
    !reduced && !userPaused && !hovering && inView && pageVisible;

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  // Autoplay tick. Resets whenever `index` changes (manual select included)
  // or whenever `autoplay` toggles, so a manual tab click gives the chosen
  // view a full AUTO_ADVANCE_MS before the next tick fires — no sudden jump.
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [index, autoplay, total]);

  // Track viewport visibility — autoplay only runs while the showcase is in
  // view. Single observer, cleaned up on unmount.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause autoplay when the browser tab is backgrounded so we're not ticking
  // against an invisible document. Document visibility is the standard
  // signal browsers use for this; cheaper and more accurate than
  // Page Lifecycle for our needs.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const read = () => setPageVisible(!document.hidden);
    read();
    document.addEventListener("visibilitychange", read);
    return () => document.removeEventListener("visibilitychange", read);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <Section tone="cream" className="overflow-hidden">
      <Container>
        <div className="grid max-w-3xl gap-4">
          <SectionEyebrow>Your India Plan · a preview</SectionEyebrow>
          <SectionHeading className="mt-1">
            Not just an itinerary.{" "}
            <span className="italic text-brand-green-dark">
              Your personal India companion.
            </span>
          </SectionHeading>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Your journey, places to explore, stays, maps, and trusted local
            advice — thoughtfully brought together in one private travel page.
          </p>
        </div>
      </Container>

      <Container>
        <div
          ref={rootRef}
          role="region"
          aria-label="Your India Plan — interactive preview"
          onKeyDown={onKeyDown}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocus={() => setHovering(true)}
          onBlur={(e) => {
            // Only release the interaction pause when focus leaves the
            // showcase entirely, not when it moves between child controls.
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setHovering(false);
            }
          }}
          className="relative mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,1fr)] lg:items-center lg:gap-6"
        >
          {/* Decorative glow behind the phone */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-[520px] max-w-xl -translate-y-1/2 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,rgba(29,158,117,0.14),transparent_70%)]"
          />

          {/* Left feature labels — desktop only */}
          <ul className="hidden lg:flex lg:flex-col lg:gap-5 lg:pl-2">
            <FeatureLabel
              side="left"
              eyebrow="Private link"
              title="One trip, one link"
              body="A private URL just for you. No app, no sign-up — open on any device."
            />
            <FeatureLabel
              side="left"
              eyebrow="Local-first"
              title="First-hand notes"
              body="Routes, timings, and gotchas written by someone who has actually been there."
            />
            <FeatureLabel
              side="left"
              eyebrow="WhatsApp support"
              title="Reach Tapan while you travel"
              body="Chat before and during your trip — the way people actually talk here."
            />
          </ul>

          {/* Phone column */}
          <div className="relative mx-auto flex w-full max-w-[320px] flex-col items-center lg:max-w-none">
            <PhoneFrame
              viewId={current.id}
              reduced={!!reduced}
              onSwipeNext={() => goTo(index + 1)}
              onSwipePrev={() => goTo(index - 1)}
            />

            {/* Prev / Play-Pause / next controls — floating under the phone */}
            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Previous view"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-brand-green hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Play preview" : "Pause preview"}
                aria-pressed={userPaused}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold tracking-wide shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
                  userPaused
                    ? "bg-brand-green text-white hover:bg-brand-green-dark"
                    : "border border-border bg-white text-charcoal hover:border-brand-green hover:text-brand-green",
                )}
              >
                {userPaused ? <Play size={13} /> : <Pause size={13} />}
                <span>{userPaused ? "Play" : "Pause"}</span>
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Next view"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-brand-green hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right feature labels — desktop only */}
          <ul className="hidden lg:flex lg:flex-col lg:gap-5 lg:pr-2">
            <FeatureLabel
              side="right"
              eyebrow="Day by day"
              title="Realistic pacing"
              body="Morning, afternoon, evening — spaced for jet lag, climate, and traffic."
            />
            <FeatureLabel
              side="right"
              eyebrow="Honest guide"
              title="What to skip"
              body="Scams, tourist traps and false economies flagged early, not after."
            />
            <FeatureLabel
              side="right"
              eyebrow="Everything mapped"
              title="Places pinned for you"
              body="Hotels, restaurants and sights — all tapped straight into your map."
            />
          </ul>
        </div>

        {/* Tab selector */}
        <div
          role="tablist"
          aria-label="Preview sections"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {VIEWS.map((v, i) => {
            const Icon = v.icon;
            const active = i === index;
            return (
              <button
                key={v.id}
                role="tab"
                aria-selected={active}
                aria-controls={`plan-preview-panel-${v.id}`}
                id={`plan-preview-tab-${v.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => goTo(i)}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
                  active
                    ? "border-brand-green bg-brand-green text-white shadow-sm"
                    : "border-border bg-white text-charcoal-soft hover:border-brand-green/50 hover:text-charcoal",
                )}
              >
                <Icon size={13} strokeWidth={2.2} />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress dots + CTA row */}
        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-1.5" aria-hidden>
            {VIEWS.map((v, i) => (
              <span
                key={v.id}
                className={cn(
                  "block h-1 rounded-full transition-all duration-500",
                  i === index
                    ? "w-8 bg-brand-green"
                    : "w-2 bg-charcoal/20",
                )}
              />
            ))}
          </div>

          <Button asChild variant="primary" size="lg">
            <Link href={planCta.href} prefetch className="group">
              {planCta.label}
              <ArrowRight
                size={16}
                className="ml-0.5 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
          <p className="text-[12px] text-muted">
            Delivered within 5–7 days · Includes WhatsApp support during your trip
          </p>
        </div>
      </Container>
    </Section>
  );
}

// ----------------------------------------------------------------------
// Phone frame + screen crossfade
// ----------------------------------------------------------------------

function PhoneFrame({
  viewId,
  reduced,
  onSwipeNext,
  onSwipePrev,
}: {
  viewId: ViewId;
  reduced: boolean;
  onSwipeNext: () => void;
  onSwipePrev: () => void;
}) {
  // Swipe gesture handling (mobile). Threshold large enough to avoid
  // accidental fires while scrolling vertically.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    touchStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) onSwipeNext();
    else onSwipePrev();
  };

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Phone body */}
      <div
        className="relative mx-auto w-[280px] rounded-[2.6rem] border border-charcoal/15 bg-charcoal p-[6px] shadow-[0_30px_80px_rgba(10,15,12,0.28)] sm:w-[300px] sm:rounded-[2.8rem]"
        style={{ aspectRatio: "9 / 19.2" }}
      >
        {/* Side button hints */}
        <span
          aria-hidden
          className="absolute left-[-2px] top-24 h-14 w-[2px] rounded-l bg-charcoal/80"
        />
        <span
          aria-hidden
          className="absolute right-[-2px] top-20 h-10 w-[2px] rounded-r bg-charcoal/80"
        />
        <span
          aria-hidden
          className="absolute right-[-2px] top-36 h-16 w-[2px] rounded-r bg-charcoal/80"
        />

        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-cream-warm sm:rounded-[2.4rem]">
          {/* Notch / dynamic island */}
          <div
            aria-hidden
            className="absolute left-1/2 top-2 z-30 flex h-6 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-charcoal"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-charcoal/80 ring-1 ring-charcoal-soft" />
          </div>

          {/* Full-screen slide — crossfades. Occupies the entire area below
              the status-bar strip (which clears the notch); object-cover
              center-crops without distortion. Parent `overflow-hidden
              rounded-[2.2rem]` on the screen clips to the device corners. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewId}
              role="tabpanel"
              id={`plan-preview-panel-${viewId}`}
              aria-labelledby={`plan-preview-tab-${viewId}`}
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute inset-x-0 bottom-0 top-9"
            >
              <HeroImage
                primary={SHOWCASE_IMAGES[viewId].primary}
                fallback={SHOWCASE_IMAGES[viewId].fallback}
                alt={SHOWCASE_IMAGES[viewId].alt}
                sizes="(min-width: 640px) 300px, 280px"
                priority={viewId === "overview"}
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Status bar — kept as device chrome, sits above the slide */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-2 text-[10px] font-medium text-charcoal">
            <span>9:41</span>
            <span className="opacity-70">● ● ●</span>
          </div>

          {/* Home indicator */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-1.5 z-30 flex justify-center"
          >
            <span className="h-1 w-20 rounded-full bg-charcoal/40" />
          </div>
        </div>
      </div>

      {/* Floating caption chip — moves with view */}
      <AnimatePresence mode="wait">
        <motion.p
          key={viewId}
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-medium text-charcoal-soft shadow-sm"
          aria-live="polite"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
          {captionFor(viewId)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function captionFor(id: ViewId): string {
  switch (id) {
    case "overview":
      return "Your trip, at a glance";
    case "itinerary":
      return "Day-by-day plan";
    case "places":
      return "Places chosen for you";
    case "map":
      return "Everything on one map";
    case "stays":
      return "Stays & food you'll love";
    case "notes":
      return "Tapan's notes & guide";
  }
}

// ----------------------------------------------------------------------
// HeroImage — tries the primary asset and swaps to the fallback on load
// failure (e.g. the real file hasn't been added to the repo yet). Resets
// state when `primary` changes so later swaps keep the fallback behavior.
// ----------------------------------------------------------------------

function HeroImage({
  primary,
  fallback,
  alt = "",
  sizes,
  priority,
  className,
}: {
  primary: string;
  fallback: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Reset the fallback flag whenever the primary src changes. The derived-
  // state pattern (compare prev → store prev → setState) is the sanctioned
  // way to do this without an effect or a ref read during render.
  const [prevPrimary, setPrevPrimary] = useState(primary);
  if (prevPrimary !== primary) {
    setPrevPrimary(primary);
    if (failed) setFailed(false);
  }
  const src = failed ? fallback : primary;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      // Next's <Image> fires onError when the underlying <img> 404s or the
      // optimizer can't resolve the source. Swap once; silent fallback.
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}

// ----------------------------------------------------------------------
// Feature label (desktop-only side bullets)
// ----------------------------------------------------------------------

function FeatureLabel({
  side,
  eyebrow,
  title,
  body,
}: {
  side: "left" | "right";
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <li
      className={cn(
        "group relative rounded-2xl border border-border bg-white/70 p-4 shadow-[0_6px_18px_rgba(20,30,25,0.04)] backdrop-blur-sm transition-all duration-500 hover:border-brand-green/30 hover:bg-white",
        side === "left" ? "lg:text-right" : "lg:text-left",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
        {eyebrow}
      </p>
      <p className="mt-1 font-serif text-lg leading-tight text-charcoal">
        {title}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-charcoal-soft">
        {body}
      </p>
    </li>
  );
}
