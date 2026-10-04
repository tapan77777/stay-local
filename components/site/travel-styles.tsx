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
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
  SectionLede,
} from "@/components/site/section";

type Style = {
  slug: string;
  label: string;
  desc: string;
};

const styles: readonly Style[] = [
  { slug: "mountains", label: "Mountains", desc: "Himalayas, valleys, quiet passes." },
  { slug: "culture", label: "Culture & Heritage", desc: "Old cities, forts, living traditions." },
  { slug: "food", label: "Food", desc: "Street food, regional kitchens, home meals." },
  { slug: "nature", label: "Nature", desc: "Forests, rivers, tea country, offbeat trails." },
  { slug: "wildlife", label: "Wildlife", desc: "Tigers, elephants, birds, national parks." },
  { slug: "adventure", label: "Adventure", desc: "Treks, surf, dives, high-altitude drives." },
  { slug: "local-life", label: "Local Life", desc: "Homestays, villages, slow days with locals." },
  { slug: "comfort", label: "Comfort", desc: "Boutique stays, private transport, easy pacing." },
] as const;

// Seconds for the track to travel one full set width. Slower = more editorial.
const LOOP_SECONDS = 34;
const EASE = [0.22, 1, 0.36, 1] as const;

export function TravelStyles() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const firstGroupRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  // Shared parallax: all card images translate together as the section crosses
  // the viewport vertically. Each image inside the horizontal marquee uses
  // this same motion value, so the row reads as a single depth layer rather
  // than N independently-parallaxing images.
  const { scrollYProgress } = useScroll({
    target: sectionRef as React.RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.3,
  });
  const imageY = useTransform(smoothed, [0, 1], ["-5%", "5%"]);
  const imageScale = useTransform(smoothed, [0, 0.5, 1], [1.08, 1, 1.06]);

  // Auto-scroll driver: browser handles user swipe/drag via overflow-x-auto,
  // and we advance scrollLeft each frame. Wrap when scrollLeft passes the
  // first group's width — because set B is a pixel-perfect duplicate of set A,
  // subtracting the group width is visually seamless.
  useEffect(() => {
    if (reduced) return;
    const container = scrollRef.current;
    const track = firstGroupRef.current;
    if (!container || !track) return;

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current) {
        const half = track.offsetWidth;
        if (half > 0) {
          const pxPerMs = half / (LOOP_SECONDS * 1000);
          let next = container.scrollLeft + pxPerMs * dt;
          if (next >= half) next -= half;
          container.scrollLeft = next;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <Section tone="cream" className="overflow-hidden border-b border-border">
      <div ref={sectionRef}>
        <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>Start with what you love</SectionEyebrow>
          <SectionHeading className="mt-3">
            What kind of India are you looking for?
          </SectionHeading>
          <SectionLede>
            India isn&apos;t one trip — it&apos;s many. Choose what pulls you
            in, and we&apos;ll shape a route around it on the call.
          </SectionLede>
        </div>
      </Container>

      <motion.div
        className="mt-12 lg:mt-14"
        initial={reduced ? false : { opacity: 0, y: 24 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onMouseEnter={pause}
          onMouseLeave={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
          onTouchCancel={resume}
          onFocus={pause}
          onBlur={resume}
        >
          <div className="flex">
            <div
              ref={firstGroupRef}
              className="flex shrink-0 gap-5 pl-5 pr-5 sm:pl-7 sm:pr-6 lg:gap-6 lg:pl-10 lg:pr-6"
            >
              {styles.map((s, i) => (
                <TravelCard
                  key={s.slug}
                  style={s}
                  priority={i < 3}
                  reduced={!!reduced}
                  imageY={imageY}
                  imageScale={imageScale}
                />
              ))}
            </div>
            {/* Duplicate set for the seamless marquee loop. Rendered always
                for SSR/client parity; hidden via CSS media query when the user
                prefers reduced motion (row remains manually scrollable). */}
            <div
              className="flex shrink-0 gap-5 pr-5 motion-reduce:hidden sm:pr-6 lg:gap-6 lg:pr-10"
              aria-hidden="true"
            >
              {styles.map((s) => (
                <TravelCard
                  key={`dup-${s.slug}`}
                  style={s}
                  duplicate
                  reduced={!!reduced}
                  imageY={imageY}
                  imageScale={imageScale}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <Container className="mt-10 lg:mt-12">
        <p className="max-w-2xl text-sm text-muted">
          Want more than one? Most trips mix two or three. Bring them all to
          the $10 call — we&apos;ll shape them into a real route.
        </p>
      </Container>
      </div>
    </Section>
  );
}

function TravelCard({
  style,
  priority,
  duplicate,
  reduced,
  imageY,
  imageScale,
}: {
  style: Style;
  priority?: boolean;
  duplicate?: boolean;
  reduced: boolean;
  imageY: MotionValue<string>;
  imageScale: MotionValue<number>;
}) {
  const [failed, setFailed] = useState(false);
  const src = `/images/travel-styles/${style.slug}.jpg`;

  return (
    <Link
      href="/consultation"
      className="group flex h-[460px] w-[82vw] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-charcoal shadow-[0_10px_30px_rgba(20,30,25,0.06)] transition-transform duration-500 ease-out hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-[500px] sm:w-[360px] lg:h-[540px] lg:w-[380px]"
      aria-hidden={duplicate ? "true" : undefined}
      tabIndex={duplicate ? -1 : undefined}
    >
      {/* Top: text area */}
      <div className="flex flex-col gap-2.5 p-6 lg:gap-3 lg:p-7">
        <p className="eyebrow text-brand-green-dark">India · Style</p>
        <p className="font-serif text-2xl leading-tight text-charcoal lg:text-[26px]">
          {style.label}
        </p>
        <p className="text-sm leading-relaxed text-muted">{style.desc}</p>
        <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-green">
          Plan this
          <ArrowRight
            size={12}
            className="transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
        </span>
      </div>

      {/* Bottom: photograph */}
      <div className="relative flex-1 overflow-hidden bg-brand-green-dark">
        {failed ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_10%,rgba(255,255,255,0.14),transparent_55%),linear-gradient(160deg,var(--tw-gradient-stops))] from-brand-green-dark via-brand-green to-brand-green-dark"
          />
        ) : (
          <motion.div
            className="absolute inset-0"
            style={reduced ? undefined : { y: imageY, scale: imageScale }}
          >
            <Image
              src={src}
              alt={duplicate ? "" : `${style.label} — ${style.desc}`}
              fill
              priority={priority && !duplicate}
              loading={priority && !duplicate ? undefined : "lazy"}
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 360px, 82vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              onError={() => setFailed(true)}
            />
          </motion.div>
        )}
        {/* Soft photographic fade at the seam — cream card colour fades to
            transparent over ~32px so the boundary reads as a gentle blend
            rather than a hard cut. Sits above the image, below any interaction. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-card via-card/70 to-transparent"
        />
      </div>
    </Link>
  );
}
