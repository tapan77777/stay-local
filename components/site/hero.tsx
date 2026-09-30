"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Volume2, VolumeX } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import { Container } from "@/components/site/container";
import { HeroVideo } from "@/components/site/hero-video";
import { Button } from "@/components/ui/button";
import { primaryCta } from "@/lib/site";

const HERO_FALLBACK = {
  src: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=85",
  alt: "India at golden hour — the kind of view you plan a trip around",
};

// Configurable focal points for the hero video. Two axes so mobile (portrait
// viewport, aggressive horizontal crop) and desktop (near-native aspect, minor
// vertical crop) can be framed independently. Defaults are dead-center — the
// least opinionated cover crop for arbitrary travel footage.
// If the real video's subject sits off-center, nudge these values.
// Reasonable alternatives: "48% 50%", "50% 48%", "52% 50%".
const HERO_FOCAL = {
  mobile: "50% 50%",
  desktop: "50% 50%",
} as const;

const cardBullets = [
  "Tell me what you're planning",
  "Get honest local advice",
  "Ask about routes, places & transport",
  "Know what to watch out for",
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  // Start with sound-on intent. HeroVideo will attempt unmuted autoplay and
  // fall back to muted (calling setMuted(true)) if the browser blocks it.
  const [muted, setMuted] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.02]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.6], ["0%", "-6%"]);

  const container = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
      };

  const item = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
      };

  const cardVariants = reduced
    ? { hidden: { opacity: 1, x: 0 }, show: { opacity: 1, x: 0 } }
    : {
        hidden: { opacity: 0, x: 40 },
        show: {
          opacity: 1,
          x: 0,
          transition: { duration: 1, ease: EASE, delay: 0.85 },
        },
      };

  return (
    <section
      ref={sectionRef}
      className="relative -mt-16 min-h-[100svh] overflow-hidden bg-charcoal text-cream lg:-mt-[72px]"
      aria-label="StayLocal hero"
    >
      {/* Video + still fallback layer with subtle parallax */}
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { scale: videoScale, y: videoY }}
      >
        <HeroVideo
          fallback={HERO_FALLBACK}
          focalMobile={HERO_FOCAL.mobile}
          focalDesktop={HERO_FOCAL.desktop}
          muted={muted}
          onMutedChange={setMuted}
        />
      </motion.div>

      {/* Overlays — subtle top scrim for nav readability, deeper bottom for text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-charcoal/45 via-transparent to-charcoal/80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_55%_at_50%_100%,rgba(15,20,15,0.35),transparent_60%)]"
      />
      {/* Soft handoff to the cream page beneath */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-24 bg-gradient-to-b from-transparent to-cream"
      />

      {/* Audio toggle — top-right, above overlays, below navbar visually */}
      {!reduced && (
        <motion.button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute hero video" : "Mute hero video"}
          aria-pressed={!muted}
          className="absolute right-5 top-20 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 text-cream backdrop-blur-md transition-all hover:scale-[1.04] hover:bg-white/20 hover:border-white/40 sm:right-7 lg:right-10 lg:top-24"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: EASE }}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </motion.button>
      )}

      {/* Content */}
      <motion.div
        className="relative flex min-h-[100svh] flex-col"
        style={reduced ? undefined : { opacity: contentOpacity, y: contentY }}
      >
        {/* Spacer to keep content clear of the overlaid navbar */}
        <div className="h-16 shrink-0 lg:h-[72px]" aria-hidden />

        <Container className="flex flex-1 flex-col justify-end pb-12 pt-6 sm:pb-16 lg:pb-24 lg:pt-8">
          <motion.div
            className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Text column — compressed on mobile so the video stays dominant */}
            <div className="max-w-xl">
              <motion.p
                variants={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-cream/90 backdrop-blur-sm sm:text-[11px]"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-green-light" />
                Coming to India?
              </motion.p>

              <motion.h1
                variants={item}
                className="mt-4 font-serif text-[34px] leading-[1.04] tracking-tight text-cream sm:mt-6 sm:text-5xl lg:text-[72px] lg:leading-[1.02]"
              >
                India can be incredible.
                <br />
                <span className="text-cream/85">It can also be </span>
                <span className="italic text-brand-green-light">
                  confusing.
                </span>
              </motion.h1>

              <motion.div variants={item} className="mt-6 sm:mt-7 lg:mt-9">
                <Button asChild variant="primary" size="lg" className="lg:h-14 lg:px-8 lg:text-base">
                  <Link href={primaryCta.href} prefetch className="group">
                    {primaryCta.label}
                    <ArrowRight
                      size={16}
                      className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </Button>
              </motion.div>

              <motion.p
                variants={item}
                className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-cream/70 sm:text-xs"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-green-light" />
                  60-minute private 1-on-1
                </span>
                <span aria-hidden className="text-cream/40">
                  ·
                </span>
                <span>No obligation to book anything else.</span>
              </motion.p>
            </div>

            {/* Floating conversion card — desktop only */}
            <motion.aside
              variants={cardVariants}
              initial="hidden"
              animate="show"
              className="hidden lg:block lg:justify-self-end lg:self-end"
            >
              <TalkCard />
            </motion.aside>
          </motion.div>
        </Container>

        {/* Scroll cue — desktop only, understated */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center text-cream/45 sm:flex"
          initial={reduced ? false : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <motion.div
            animate={
              reduced
                ? undefined
                : { y: [0, 6, 0], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }
            }
            className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.22em]"
          >
            <span>Scroll</span>
            <ChevronDown size={14} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Mobile talk-card as a compact in-flow panel, below the hero content */}
      <div className="relative bg-cream text-charcoal lg:hidden">
        <Container className="py-10">
          <TalkCard compact />
        </Container>
      </div>
    </section>
  );
}

function TalkCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-border bg-card p-6 shadow-[0_10px_40px_rgba(20,30,25,0.06)]"
          : "w-[360px] rounded-3xl border border-white/40 bg-cream/95 p-7 text-charcoal shadow-[0_30px_80px_rgba(10,15,12,0.35)] backdrop-blur-md"
      }
    >
      <p className="eyebrow">Talk to Tapan</p>
      <p className="mt-3 font-serif text-xl leading-snug text-charcoal">
        Not sure how to plan India?
      </p>

      <ul className="mt-5 space-y-2.5">
        {cardBullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2.5 text-[14px] leading-snug text-charcoal-soft"
          >
            <Check
              size={14}
              strokeWidth={2.5}
              className="mt-[3px] shrink-0 text-brand-green"
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-baseline gap-2 border-t border-border pt-5">
        <span className="font-serif text-3xl leading-none text-charcoal">
          $10
        </span>
        <span className="text-xs text-muted">60-minute private consultation</span>
      </div>

      <Button asChild variant="primary" size="lg" className="mt-5 w-full">
        <Link href={primaryCta.href} prefetch className="group">
          Choose a time
          <ArrowRight
            size={14}
            className="ml-0.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </Button>
    </div>
  );
}
