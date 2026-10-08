"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
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
  MessageCircle,
  Moon,
  Pause,
  Play,
  Sun,
  Sunset,
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
 * phone-shaped frame crossfades between six screens. Autoplays, pauses on
 * user interaction, and respects prefers-reduced-motion. All data is
 * clearly fictional (sample trip for "Maya & James") and labeled DEMO.
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
            See what you actually{" "}
            <span className="italic text-brand-green-dark">receive.</span>
          </SectionHeading>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            A private, personal travel companion in your pocket — not a PDF.
            Here&apos;s a sample trip to feel the shape of your own plan.
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

          {/* Status bar */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-2 text-[10px] font-medium text-charcoal">
            <span>9:41</span>
            <span className="opacity-70">● ● ●</span>
          </div>

          {/* Mini app top bar */}
          <div className="absolute inset-x-0 top-9 z-20 flex items-center justify-between px-4">
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              StayLocal
            </span>
            <span className="rounded-full border border-charcoal/15 bg-white/70 px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-[0.2em] text-charcoal-soft">
              Demo
            </span>
          </div>

          {/* Screen content — crossfades */}
          <div
            role="tabpanel"
            id={`plan-preview-panel-${viewId}`}
            aria-labelledby={`plan-preview-tab-${viewId}`}
            className="absolute inset-0 pt-[52px]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={viewId}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="h-full w-full overflow-hidden"
              >
                <Screen viewId={viewId} />
              </motion.div>
            </AnimatePresence>
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
// Screens
// ----------------------------------------------------------------------

function Screen({ viewId }: { viewId: ViewId }) {
  switch (viewId) {
    case "overview":
      return <OverviewScreen />;
    case "itinerary":
      return <ItineraryScreen />;
    case "places":
      return <PlacesScreen />;
    case "map":
      return <MapScreen />;
    case "stays":
      return <StaysScreen />;
    case "notes":
      return <NotesScreen />;
  }
}

function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-none h-full w-full overflow-y-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

function OverviewScreen() {
  return (
    <ScreenShell>
      {/* Hero image */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-charcoal">
        <Image
          src="/images/travel-styles/culture.jpg"
          alt=""
          fill
          sizes="320px"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/85">
            Your India journey
          </p>
          <p className="font-serif text-[18px] leading-tight text-cream">
            Maya &amp; James in India
          </p>
        </div>
      </div>

      {/* Trip meta card */}
      <div className="mx-3 -mt-6 rounded-xl border border-border bg-white p-3 shadow-[0_6px_18px_rgba(20,30,25,0.1)]">
        <p className="font-serif text-[13px] text-charcoal">
          Mar 2 – Mar 15, 2026
        </p>
        <p className="mt-0.5 text-[10px] text-muted">
          14 days · 4 destinations · Classic North India
        </p>
      </div>

      {/* Destinations chip row */}
      <div className="mt-4 px-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          Your journey
        </p>
        <ul className="mt-2 space-y-2">
          {[
            { n: "01", city: "Delhi", range: "Mar 2 – Mar 4", nights: "2 nights" },
            { n: "02", city: "Agra", range: "Mar 4 – Mar 6", nights: "2 nights" },
            { n: "03", city: "Jaipur", range: "Mar 6 – Mar 10", nights: "4 nights" },
            { n: "04", city: "Udaipur", range: "Mar 10 – Mar 15", nights: "5 nights" },
          ].map((d) => (
            <li
              key={d.city}
              className="flex items-center gap-3 rounded-lg border border-border bg-white px-2.5 py-2"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream-warm text-[9px] font-semibold text-brand-green-dark">
                {d.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-[13px] leading-tight text-charcoal">
                  {d.city}
                </span>
                <span className="mt-0.5 block text-[9px] text-muted">
                  {d.range} · {d.nights}
                </span>
              </span>
              <ArrowRight size={11} className="text-brand-green-dark" />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 px-3">
        <div className="rounded-xl bg-brand-green px-3 py-2.5 text-cream">
          <p className="flex items-center gap-1.5 text-[11px] font-medium">
            <MessageCircle size={12} /> Chat with Tapan
          </p>
          <p className="mt-0.5 text-[9px] text-cream/80">
            Questions before you fly? Message anytime.
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}

function ItineraryScreen() {
  const days = [
    {
      date: "Mar 6 · Fri",
      day: "Day 5",
      place: "Arrive Jaipur",
      blocks: [
        {
          icon: Sun,
          label: "Morning",
          body: "Train from Agra Cantt — Shatabdi #12035 at 08:10, arrives 12:35.",
        },
        {
          icon: Sunset,
          label: "Afternoon",
          body: "Settle at Suján Rajmahal Palace. Walk to Bar Palladio for a slow lunch.",
        },
        {
          icon: Moon,
          label: "Evening",
          body: "Thali at LMB on Johari Bazaar; sunset drive to Nahargarh.",
        },
      ],
    },
  ];

  return (
    <ScreenShell>
      <div className="px-3 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
            Day by day
          </p>
          <div className="flex items-center gap-1 text-[9px] text-muted">
            <span>5 / 14</span>
            <ChevronRight size={10} />
          </div>
        </div>
        <h3 className="mt-2 font-serif text-[18px] leading-tight text-charcoal">
          Arrive Jaipur
        </h3>
        <p className="mt-0.5 text-[10px] text-muted">
          Mar 6, 2026 · Friday · 4 nights
        </p>
      </div>

      {days.map((d) => (
        <div key={d.day} className="mt-3 space-y-2 px-3">
          {d.blocks.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="rounded-lg border border-border bg-white p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={11} className="text-brand-green-dark" />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-green-dark">
                    {b.label}
                  </p>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-charcoal-soft">
                  {b.body}
                </p>
              </div>
            );
          })}

          <div className="rounded-lg bg-cream-warm px-2.5 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-terracotta">
              Watch out
            </p>
            <p className="mt-1 text-[10px] leading-snug text-charcoal-soft">
              Pink City traffic is heavy after 5pm — head up to Nahargarh
              early for a clean sunset.
            </p>
          </div>
        </div>
      ))}

      <div className="mt-3 px-3 text-[10px] text-muted">
        <p className="flex items-center justify-between">
          <span>← Day 4 · Agra</span>
          <span className="text-brand-green-dark">Day 6 · Jaipur →</span>
        </p>
      </div>
    </ScreenShell>
  );
}

function PlacesScreen() {
  const places = [
    {
      name: "Amber Fort",
      meta: "Fort · Jaipur",
      img: "/images/travel-styles/culture.jpg",
      tag: "Must see",
    },
    {
      name: "Taj Mahal",
      meta: "Monument · Agra",
      img: "/images/travel-styles/comfort.jpg",
      tag: "Sunrise",
    },
    {
      name: "City Palace",
      meta: "Palace · Udaipur",
      img: "/images/travel-styles/local-life.jpg",
      tag: "Half day",
    },
  ];

  return (
    <ScreenShell>
      <div className="px-3 pt-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          Places to explore
        </p>
        <h3 className="mt-2 font-serif text-[18px] leading-tight text-charcoal">
          Chosen for your trip
        </h3>
        <p className="mt-0.5 text-[10px] text-muted">
          12 places pinned across 4 cities
        </p>
      </div>

      <ul className="mt-3 space-y-2.5 px-3">
        {places.map((p, i) => (
          <li
            key={p.name}
            className="overflow-hidden rounded-xl border border-border bg-white"
          >
            <div className="relative aspect-[16/8] w-full bg-cream-warm">
              <Image
                src={p.img}
                alt=""
                fill
                sizes="300px"
                className="object-cover"
                priority={i === 0}
              />
              <span className="absolute left-2 top-2 rounded-full bg-cream/95 px-1.5 py-[2px] text-[8px] font-semibold uppercase tracking-[0.16em] text-charcoal">
                {p.tag}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2">
              <div className="min-w-0">
                <p className="font-serif text-[13px] leading-tight text-charcoal">
                  {p.name}
                </p>
                <p className="mt-0.5 text-[9px] text-muted">{p.meta}</p>
              </div>
              <MapPin size={12} className="shrink-0 text-brand-green-dark" />
            </div>
          </li>
        ))}
      </ul>
    </ScreenShell>
  );
}

function MapScreen() {
  // Static, abstract India map. No external tile provider.
  return (
    <ScreenShell>
      <div className="px-3 pt-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          Your map
        </p>
        <h3 className="mt-2 font-serif text-[18px] leading-tight text-charcoal">
          North India route
        </h3>
      </div>

      <div className="relative mx-3 mt-3 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-brand-green-light via-cream to-cream-warm">
        <svg
          viewBox="0 0 300 420"
          className="block h-auto w-full"
          role="img"
          aria-label="Stylized map of northern India with four pins"
        >
          {/* Soft terrain blobs */}
          <defs>
            <radialGradient id="landGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="300" height="420" fill="transparent" />
          <path
            d="M60,40 C110,20 200,25 240,70 C280,120 275,180 250,230 C230,275 200,310 170,340 C150,360 120,380 90,370 C55,360 35,320 40,270 C45,220 30,170 40,120 C45,80 40,55 60,40 Z"
            fill="url(#landGlow)"
            stroke="#1D9E75"
            strokeOpacity="0.35"
            strokeWidth="1.2"
            strokeDasharray="2 3"
          />

          {/* Grid dots for texture */}
          {Array.from({ length: 10 }).map((_, row) =>
            Array.from({ length: 7 }).map((__, col) => (
              <circle
                key={`${row}-${col}`}
                cx={30 + col * 36}
                cy={30 + row * 36}
                r="0.9"
                fill="#1A2320"
                fillOpacity="0.08"
              />
            )),
          )}

          {/* Route line connecting pins */}
          <path
            d="M90,110 Q130,140 150,170 Q170,210 180,250 Q190,290 160,320"
            fill="none"
            stroke="#C1613A"
            strokeOpacity="0.75"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="4 5"
          />

          {/* Pins */}
          {[
            { x: 90, y: 110, label: "Delhi" },
            { x: 150, y: 170, label: "Agra" },
            { x: 180, y: 250, label: "Jaipur" },
            { x: 160, y: 320, label: "Udaipur" },
          ].map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r="10" fill="#1D9E75" fillOpacity="0.18" />
              <circle cx={p.x} cy={p.y} r="5" fill="#1D9E75" />
              <circle cx={p.x} cy={p.y} r="1.6" fill="#FAFAF8" />
              <text
                x={p.x + 10}
                y={p.y + 3}
                fontSize="9"
                fontFamily="var(--font-sans)"
                fontWeight="600"
                fill="#1A2320"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-md bg-white/85 px-2 py-1 backdrop-blur">
          <span className="flex items-center gap-1.5 text-[9px] font-medium text-charcoal-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
            Stops
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-medium text-charcoal-soft">
            <span className="h-[2px] w-3 rounded-full bg-terracotta/80" />
            Route
          </span>
        </div>
      </div>

      <div className="mx-3 mt-3 rounded-lg border border-border bg-white p-2.5">
        <p className="font-serif text-[13px] text-charcoal">
          Everything in one place
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-muted">
          Hotels, restaurants and sights — tap any pin to see Tapan&apos;s notes.
        </p>
      </div>
    </ScreenShell>
  );
}

function StaysScreen() {
  const items = [
    {
      kind: "Stay",
      name: "Suján Rajmahal Palace",
      meta: "Jaipur · 4 nights",
      img: "/images/travel-styles/comfort.jpg",
      note: "The gold suite is worth it; book the garden breakfast.",
    },
    {
      kind: "Food",
      name: "Bar Palladio",
      meta: "Jaipur · Italian in a cobalt palace",
      img: "/images/travel-styles/food.jpg",
      note: "Order the burrata and ask for the courtyard table.",
    },
    {
      kind: "Stay",
      name: "Taj Lake Palace",
      meta: "Udaipur · 2 nights",
      img: "/images/travel-styles/mountains.jpg",
      note: "Ask for a lake-facing room on the east wing.",
    },
  ];

  return (
    <ScreenShell>
      <div className="px-3 pt-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          Stays &amp; food
        </p>
        <h3 className="mt-2 font-serif text-[18px] leading-tight text-charcoal">
          Hand-picked, not scraped
        </h3>
      </div>

      <ul className="mt-3 space-y-2 px-3">
        {items.map((it, i) => (
          <li
            key={it.name}
            className="flex gap-2 overflow-hidden rounded-xl border border-border bg-white p-1.5"
          >
            <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-cream-warm">
              <Image
                src={it.img}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-brand-green-dark">
                {it.kind}
              </p>
              <p className="mt-0.5 truncate font-serif text-[12px] leading-tight text-charcoal">
                {it.name}
              </p>
              <p className="truncate text-[9px] text-muted">{it.meta}</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-charcoal-soft">
                {it.note}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </ScreenShell>
  );
}

function NotesScreen() {
  const tips = [
    "At IGI T3, pre-paid taxi queues move faster from the Terminal 2 side.",
    "Amber Fort — enter from Suraj Pol, not the lower car park.",
    "ATMs: use HDFC or Axis in tourist towns; avoid white-label booths.",
  ];

  return (
    <ScreenShell>
      <div className="px-3 pt-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          A note from Tapan
        </p>
      </div>

      {/* Signature note */}
      <div className="mx-3 mt-2 rounded-xl border border-brand-green/20 bg-white p-3">
        <p className="font-serif text-[13px] italic leading-snug text-charcoal">
          &ldquo;Pace matters more than places. Four nights in Udaipur is
          not too long — it&apos;s the first time you&apos;ll stop
          feeling like a tourist.&rdquo;
        </p>
        <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-green-dark">
          — Tapan, StayLocal
        </p>
      </div>

      {/* India guide */}
      <div className="mx-3 mt-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          India guide · what to watch out for
        </p>
        <ul className="mt-2 space-y-1.5">
          {tips.map((t) => (
            <li
              key={t}
              className="flex items-start gap-2 rounded-lg border border-border bg-white px-2 py-1.5"
            >
              <span className="mt-[2px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
              <span className="text-[10px] leading-snug text-charcoal-soft">
                {t}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-3 mt-3 rounded-lg bg-cream-warm px-2.5 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-green-dark">
          Keep reading
        </p>
        <p className="mt-1 text-[10px] leading-snug text-charcoal-soft">
          Full India travel guide: SIMs, trains, tipping, haggling, weather windows.
        </p>
      </div>
    </ScreenShell>
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
