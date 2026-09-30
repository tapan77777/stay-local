"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
  SectionLede,
} from "@/components/site/section";
import { Button } from "@/components/ui/button";
import {
  services,
  comparisonMatrix,
  type ComparisonRow,
  type ServiceTier,
} from "@/lib/services";

const EASE = [0.22, 1, 0.36, 1] as const;

// Per-card presentation copy for this section. Descriptions are editorial
// rewrites of each service's tagline; the modal below shows the *source of
// truth* (tagline, bestFor, includes, notIncluded) straight from services.ts,
// so nothing on the detail view is invented.
type CardCopy = {
  hint: string;
  short: string;
  gradient: string;
};

const cardCopyById: Record<ServiceTier["id"], CardCopy> = {
  consultation: {
    hint: "60-minute private 1-on-1",
    short:
      "Talk directly with Tapan and get honest answers before you travel.",
    gradient:
      "bg-gradient-to-br from-brand-green-light/70 via-cream-warm to-cream",
  },
  plan: {
    hint: "Personalized travel planning",
    short:
      "A practical India itinerary built around your dates, interests and travel style.",
    gradient:
      "bg-gradient-to-br from-cream via-cream-warm to-brand-green-light/40",
  },
  "local-help": {
    hint: "Plan + personal local guide",
    short:
      "Your personalized plan plus trusted local help when you want someone on the ground.",
    gradient:
      "bg-gradient-to-br from-cream via-cream-warm to-brand-green-light/50",
  },
  curated: {
    hint: "End-to-end trip planning",
    short:
      "A complete India journey planned and organized around you.",
    gradient:
      "bg-gradient-to-br from-cream via-brand-green-light/40 to-cream-warm",
  },
};


export function ServicesSelector() {
  const reduced = useReducedMotion();
  const [openId, setOpenId] = useState<ServiceTier["id"] | null>(null);
  const openService = openId
    ? services.find((s) => s.id === openId) ?? null
    : null;

  const handleClose = useCallback(() => setOpenId(null), []);

  const cardsContainer: Variants = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
      };

  const cardItem: Variants = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      };

  const headingV: Variants = reduced
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      };

  return (
    <Section tone="cream" className="border-b border-border">
      {/* Heading */}
      <Container>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px 0px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="max-w-2xl"
        >
          <motion.div variants={headingV}>
            <SectionEyebrow>Four ways I help</SectionEyebrow>
          </motion.div>
          <motion.div variants={headingV}>
            <SectionHeading className="mt-3">
              From a $10 conversation to a trip planned end-to-end.
            </SectionHeading>
          </motion.div>
          <motion.div variants={headingV}>
            <SectionLede>
              Not everyone needs the same thing. Start with a call, or go all
              the way to a fully curated trip. You pick — and you know the
              price up front.
            </SectionLede>
          </motion.div>
        </motion.div>
      </Container>

      {/* Anchor before the cards */}
      <Container className="mt-16 lg:mt-24">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
            The four options
          </p>
          <p className="mt-2 font-serif text-2xl leading-tight tracking-tight text-charcoal lg:text-[30px]">
            Choose how much help you want.
          </p>
        </div>
      </Container>

      {/* Cards — desktop grid */}
      <Container className="mt-8 lg:mt-10">
        <motion.div
          className="hidden md:grid md:grid-cols-2 md:gap-5 xl:grid-cols-4 lg:gap-6"
          variants={cardsContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px 0px" }}
        >
          {services.map((s, i) => (
            <motion.div key={s.id} variants={cardItem} className="h-full">
              <ServiceCardTile
                service={s}
                copy={cardCopyById[s.id]}
                index={i}
                onOpen={() => setOpenId(s.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>

      {/* Cards — mobile snap carousel (edge-to-edge) */}
      <div className="mt-8 md:hidden">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 pl-5 pr-5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pl-7 sm:pr-7">
          {services.map((s, i) => (
            <li
              key={s.id}
              className="w-[82vw] shrink-0 snap-start sm:w-[320px]"
            >
              <ServiceCardTile
                service={s}
                copy={cardCopyById[s.id]}
                index={i}
                onOpen={() => setOpenId(s.id)}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Primary CTA under the cards */}
      <Container className="mt-10 lg:mt-14">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button
            asChild
            variant="primary"
            size="lg"
            className="sm:min-w-72"
          >
            <Link href="/pricing" prefetch className="group">
              See full pricing &amp; comparison
              <ArrowRight
                size={16}
                className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </div>
      </Container>

      {/* Comparison */}
      <Container className="mt-20 lg:mt-28">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
            Side by side
          </p>
          <p className="mt-2 font-serif text-2xl leading-tight tracking-tight text-charcoal lg:text-[30px]">
            Every inclusion, compared.
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            What&apos;s actually in each service — pulled straight from the
            details above.
          </p>
        </div>

        <ComparisonTable rows={comparisonMatrix} />
      </Container>

      {/* Details modal / mobile drawer */}
      <AnimatePresence>
        {openService && (
          <ServiceDetailsModal
            service={openService}
            copy={cardCopyById[openService.id]}
            index={services.findIndex((s) => s.id === openService.id)}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </Section>
  );
}

// ---------- Card ----------

function ServiceCardTile({
  service,
  copy,
  index,
  onOpen,
}: {
  service: ServiceTier;
  copy: CardCopy;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View details for ${service.name}, priced ${service.price}`}
      className={
        "group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-brand-green/15 p-6 text-left shadow-[0_10px_30px_rgba(20,30,25,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-brand-green/35 hover:shadow-[0_22px_55px_rgba(29,158,117,0.14)] focus-visible:-translate-y-1 focus-visible:border-brand-green/35 focus-visible:shadow-[0_22px_55px_rgba(29,158,117,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:p-7 " +
        copy.gradient
      }
    >
      {/* Green glow on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl bg-[radial-gradient(80%_90%_at_20%_0%,rgba(29,158,117,0.14),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
      />

      <div className="relative flex flex-1 flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-green-dark">
          {`0${index + 1}`}
        </p>

        <p className="mt-4 font-serif text-[22px] leading-tight text-charcoal lg:text-[24px]">
          {service.name}
        </p>

        <div className="mt-5">
          <p className="font-serif text-[38px] leading-none tracking-tight text-charcoal lg:text-[44px]">
            {service.price}
          </p>
          {service.priceNote && (
            <p className="mt-2 text-[11px] italic leading-snug text-muted">
              {service.priceNote}
            </p>
          )}
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/60">
          {copy.hint}
        </p>

        <p className="mt-4 text-[14px] leading-relaxed text-charcoal-soft">
          {copy.short}
        </p>

        <div className="mt-auto pt-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green transition-colors group-hover:text-brand-green-dark">
            View details
            <ArrowRight
              size={12}
              className="transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            />
          </span>
        </div>
      </div>
    </button>
  );
}

// ---------- Modal / drawer ----------

function ServiceDetailsModal({
  service,
  copy,
  index,
  onClose,
}: {
  service: ServiceTier;
  copy: CardCopy;
  index: number;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();

  // Body scroll lock + focus management. Focus previously-active element on
  // close so a keyboard user returns to the card that opened the panel.
  useEffect(() => {
    const previouslyActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyActive?.focus?.();
    };
  }, []);

  // Escape to close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      onMouseDown={onBackdropClick}
      role="presentation"
    >
      {/* Backdrop */}
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-charcoal/55 backdrop-blur-[2px]"
        initial={reduced ? false : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        exit={reduced ? undefined : { opacity: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      />

      {/* Panel */}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-cream text-charcoal shadow-[0_-24px_80px_rgba(0,0,0,0.22)] sm:max-w-[560px] sm:rounded-3xl sm:shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
        initial={
          reduced ? false : { opacity: 0, y: 32, scale: 0.985 }
        }
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        exit={
          reduced ? undefined : { opacity: 0, y: 24, scale: 0.985 }
        }
        transition={{ duration: 0.42, ease: EASE }}
      >
        {/* Close */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-card/90 text-charcoal backdrop-blur-sm transition-all hover:border-brand-green/40 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div
          className={
            "px-6 pb-6 pt-8 sm:px-8 sm:pb-7 sm:pt-9 " + copy.gradient
          }
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-green-dark">
            {`0${index + 1} · ${service.eyebrow}`}
          </p>
          <h3
            id={headingId}
            className="mt-3 pr-10 font-serif text-[26px] leading-tight text-charcoal sm:text-[30px]"
          >
            {service.name}
          </h3>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-[36px] leading-none tracking-tight text-charcoal sm:text-[42px]">
              {service.price}
            </span>
            <span className="text-xs text-muted">{service.duration}</span>
          </div>
          {service.priceNote && (
            <p className="mt-2 text-[11px] italic text-muted">
              {service.priceNote}
            </p>
          )}
          <p className="mt-4 text-[14px] leading-relaxed text-charcoal-soft">
            {service.tagline}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6 sm:px-8 sm:pb-7 sm:pt-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
            Best for
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-charcoal-soft">
            {service.bestFor}
          </p>

          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
              What&apos;s included
            </p>
            <ul className="mt-3 space-y-2">
              {service.includes.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] leading-relaxed text-charcoal-soft"
                >
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="mt-[3px] shrink-0 text-brand-green"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {service.notIncluded && service.notIncluded.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/50">
                Not included
              </p>
              <ul className="mt-3 space-y-2">
                {service.notIncluded.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-relaxed text-charcoal-soft"
                  >
                    <span
                      aria-hidden
                      className="mt-[9px] block h-[1.5px] w-3 shrink-0 rounded-full bg-charcoal/25"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/60 px-6 py-5 sm:px-8">
          <Button
            asChild
            variant="primary"
            size="lg"
            className="w-full"
          >
            <Link
              href={service.ctaHref as never}
              prefetch
              className="group"
              onClick={onClose}
            >
              {service.ctaLabel}
              <ArrowRight
                size={16}
                className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );

  // AnimatePresence + createPortal to document.body: the modal only renders
  // client-side (openId starts null on both server and client) so there's no
  // hydration or SSR concern.
  return createPortal(overlay, document.body);
}

// ---------- Comparison table ----------

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="mt-8 overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-card px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
            >
              What&apos;s included
            </th>
            {services.map((s, i) => (
              <th
                key={s.id}
                scope="col"
                className="px-4 py-4 text-center align-bottom"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
                  {`0${i + 1}`}
                </div>
                <div className="mt-1 font-serif text-[14px] leading-tight text-charcoal lg:text-[15px]">
                  {s.name}
                </div>
                <div className="mt-1 text-[12px] text-charcoal/70">
                  {s.price}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/60 last:border-b-0">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-5 py-3.5 text-[13px] font-normal leading-snug text-charcoal-soft"
              >
                {row.label}
              </th>
              {row.support.map((yes, j) => (
                <td key={j} className="px-4 py-3.5 text-center">
                  {yes ? (
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className="mx-auto text-brand-green"
                      aria-label="Included"
                    />
                  ) : (
                    <span
                      aria-label="Not included"
                      className="text-charcoal/20"
                    >
                      —
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
