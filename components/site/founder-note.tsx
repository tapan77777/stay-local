"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { useRef, useState } from "react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow } from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";

const EASE = [0.22, 1, 0.36, 1] as const;

// Categories are only listed here if the site's own experiences JSON actually
// contains trips in that theme. Mountains dominate (Himachal, Uttarakhand,
// Sikkim), treks appear across 9+ entries, villages/homestays run through
// Jibhi/Kalga/Lamahatta/Barot, and Coasts is supported by the South Goa entry.
const trips = ["Mountains", "Treks", "Villages", "Coasts"] as const;

export function FounderNote() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Scroll-driven depth for the primary portrait — starts slightly deeper
  // (scale 1.08) at section entry, settles at 1 near the middle, drifts back
  // out as it leaves. Reads as cinematic depth, not aggressive zoom.
  const { scrollYProgress } = useScroll({
    target: sectionRef as React.RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.3,
  });
  const portraitScale = useTransform(smoothed, [0, 0.5, 1], [1.08, 1, 1.04]);
  const portraitY = useTransform(smoothed, [0, 1], ["-4%", "4%"]);
  const secondaryY = useTransform(smoothed, [0, 1], ["6%", "-6%"]);

  const container = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
      };

  const fadeUp = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      };

  const primaryV = reduced
    ? { hidden: { opacity: 1, scale: 1 }, show: { opacity: 1, scale: 1 } }
    : {
        hidden: { opacity: 0, scale: 1.03 },
        show: {
          opacity: 1,
          scale: 1,
          transition: { duration: 1, ease: EASE },
        },
      };

  const secondaryV = reduced
    ? {
        hidden: { opacity: 1, y: 0, scale: 1 },
        show: { opacity: 1, y: 0, scale: 1 },
      }
    : {
        hidden: { opacity: 0, y: 16, scale: 1.03 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 1, ease: EASE },
        },
      };

  return (
    <Section tone="warm">
      <div ref={sectionRef}>
      <Container>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px 0px" }}
          className="grid gap-14 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:items-center lg:gap-20"
        >
          {/* Left — photo composition */}
          <div className="order-1">
            <PhotoStory
              primaryV={primaryV}
              secondaryV={secondaryV}
              reduced={!!reduced}
              portraitScale={portraitScale}
              portraitY={portraitY}
              secondaryY={secondaryY}
            />
          </div>

          {/* Right — story */}
          <div className="order-2 flex flex-col">
            <motion.div variants={fadeUp}>
              <SectionEyebrow>Meet Tapan — Your India Expert</SectionEyebrow>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-4 font-serif text-[32px] leading-[1.06] tracking-tight text-charcoal sm:text-[40px] lg:text-[46px]"
            >
              I&apos;ve travelled India.
              <br />
              <span className="italic text-brand-green-dark">
                Now I&apos;ll help you make sense of it.
              </span>
            </motion.h2>

            <motion.div
              variants={fadeUp}
              className="mt-6 space-y-4 text-[15px] leading-relaxed text-charcoal-soft lg:text-base"
            >
              <p>
                I&apos;m Tapan Naik. I&apos;ve travelled through mountains,
                coastlines, villages and cities across India. A lot of what I
                recommend comes from places I&apos;ve actually slept in, eaten
                at, or explored myself.
              </p>
              <p>
                I started StayLocal because planning India from the outside
                can be confusing — generic itineraries, tourist traps and
                advice that doesn&apos;t always come from firsthand experience.
              </p>
            </motion.div>

            {/* Direct-to-you statement */}
            <motion.p
              variants={fadeUp}
              className="mt-7 border-l-2 border-brand-green pl-5 font-serif text-[20px] italic leading-snug text-charcoal lg:text-[22px]"
            >
              When you book with StayLocal, you talk directly to me.
            </motion.p>

            {/* Firsthand strip */}
            <motion.div
              variants={fadeUp}
              className="mt-9 border-t border-border pt-6"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
                From my own trips
              </p>
              <p
                className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-serif text-lg tracking-wide text-charcoal lg:text-xl"
                aria-label="Categories drawn from real trips: Mountains, Treks, Villages, Coasts"
              >
                {trips.map((t, i) => (
                  <span key={t} className="inline-flex items-center gap-3">
                    <span>{t}</span>
                    {i < trips.length - 1 && (
                      <span
                        aria-hidden
                        className="text-brand-green/50"
                      >
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4"
            >
              <ConsultCta size="lg" />
              <Link
                href="/experiences"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-charcoal underline-offset-4 hover:text-brand-green hover:underline"
              >
                See where I&apos;ve travelled
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </Container>
      </div>
    </Section>
  );
}

// ---------- Photo composition ----------
// Primary is the real portrait at /images/tapan.jpg. If that file is missing
// (or later replaced with a different filename), the primary falls back to
// an existing authentic travel photograph so the section never displays a
// large empty placeholder. Secondary is a real Himalayas image — the terrain
// that shows up most across the site's own trip journals.

function PhotoStory({
  primaryV,
  secondaryV,
  reduced,
  portraitScale,
  portraitY,
  secondaryY,
}: {
  primaryV: Variants;
  secondaryV: Variants;
  reduced: boolean;
  portraitScale: MotionValue<number>;
  portraitY: MotionValue<string>;
  secondaryY: MotionValue<string>;
}) {
  const [primaryFailed, setPrimaryFailed] = useState(false);

  const primarySrc = primaryFailed
    ? "/images/travel-styles/local-life.jpg"
    : "/images/tapan.jpg";
  const primaryAlt = primaryFailed
    ? "A moment from India — a real place from a real trip"
    : "Tapan Naik in India";

  return (
    <div className="relative w-full pb-10 lg:pb-14">
      {/* Primary image — full column width, tall portrait aspect */}
      <motion.figure
        variants={primaryV}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border/60 bg-cream-warm shadow-[0_24px_60px_rgba(20,30,25,0.10)]"
      >
        <motion.div
          className="absolute inset-0"
          style={reduced ? undefined : { y: portraitY, scale: portraitScale }}
        >
          <Image
            src={primarySrc}
            alt={primaryAlt}
            fill
            sizes="(min-width: 1024px) 42vw, 92vw"
            className="object-cover"
            style={{ objectPosition: primaryFailed ? "50% 50%" : "50% 28%" }}
            priority
            onError={() => {
              if (!primaryFailed) {
                console.warn(
                  "[FounderNote] /images/tapan.jpg failed to load — falling back to travel photo",
                );
                setPrimaryFailed(true);
              }
            }}
          />
        </motion.div>
      </motion.figure>

      {/* Secondary overlapping image — bottom-right editorial breakout.
          Drifts in the opposite direction to the primary portrait so the
          two layers read as separate depth planes. */}
      <motion.figure
        variants={secondaryV}
        className="absolute -bottom-2 right-3 aspect-[4/3] w-[54%] overflow-hidden rounded-2xl border border-border/60 bg-cream-warm shadow-[0_18px_45px_rgba(20,30,25,0.14)] sm:-bottom-4 sm:right-5 sm:w-[48%] lg:-bottom-6 lg:right-6 lg:w-[54%]"
      >
        <motion.div
          className="absolute inset-0"
          style={reduced ? undefined : { y: secondaryY }}
        >
          <Image
            src="/images/travel-styles/mountains.jpg"
            alt="A Himalayan range — the kind of route Tapan travels himself"
            fill
            sizes="(min-width: 1024px) 22vw, 44vw"
            className="object-cover"
          />
        </motion.div>
      </motion.figure>
    </div>
  );
}
