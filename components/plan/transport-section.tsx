"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, ExternalLink } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import {
  TRANSPORT_TYPE_LABEL,
  type Transport,
  type TransportType,
} from "@/lib/plan/types";

/*
 * Transport cards — one per admin entry. Scannable: the from/to pair is the
 * dominant line, then meta rows for duration / booking / price, then
 * instructions, then optional Tapan tip and warning.
 */

export interface TransportSectionProps {
  transports: readonly Transport[];
}

function has(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function heading(t: Transport): string {
  if (has(t.fromLocation) && has(t.toLocation)) return `${t.fromLocation} → ${t.toLocation}`;
  if (has(t.fromLocation)) return t.fromLocation;
  if (has(t.toLocation)) return t.toLocation;
  return TRANSPORT_TYPE_LABEL[t.transportType];
}

export function TransportSection({ transports }: TransportSectionProps) {
  if (transports.length === 0) return null;
  return (
    <section className="mx-auto mt-10 max-w-2xl px-5 sm:px-6">
      <ol className="space-y-5">
        {transports.map((t, i) => (
          <li key={t.id}>
            <TransportCard transport={t} index={i} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function TransportCard({ transport, index }: { transport: Transport; index: number }) {
  const t = transport;
  const typeLabel = TRANSPORT_TYPE_LABEL[t.transportType as TransportType] ?? "Transport";
  const h = heading(t);
  const headerPair = has(t.fromLocation) && has(t.toLocation);

  return (
    <CinematicReveal y={16} delay={0.03 + index * 0.03}>
      <article className="rounded-3xl bg-white px-5 py-6 shadow-[0_1px_2px_rgba(20,30,25,0.04)] sm:px-7 sm:py-7">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          {typeLabel}
        </p>
        {headerPair ? (
          <h3 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-serif text-[22px] leading-[1.12] tracking-tight text-charcoal sm:text-[26px]">
            <span>{t.fromLocation}</span>
            <ArrowRight size={16} className="shrink-0 text-brand-green-dark" aria-hidden />
            <span>{t.toLocation}</span>
          </h3>
        ) : (
          <h3 className="mt-2 font-serif text-[22px] leading-[1.12] tracking-tight text-charcoal sm:text-[26px]">
            {h}
          </h3>
        )}

        {(has(t.duration) || has(t.priceGuidance)) ? (
          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {has(t.duration) ? (
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Time
                </dt>
                <dd className="mt-0.5 text-[14.5px] text-charcoal">{t.duration}</dd>
              </div>
            ) : null}
            {has(t.priceGuidance) ? (
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Cost
                </dt>
                <dd className="mt-0.5 text-[14.5px] text-charcoal">{t.priceGuidance}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {has(t.instructions) ? (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
              How it works
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal-soft">
              {t.instructions}
            </p>
          </div>
        ) : null}

        {has(t.bookingInfo) ? (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
              Booking
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal-soft">
              {t.bookingInfo}
            </p>
            {/^https?:\/\//i.test(t.bookingInfo.trim()) ? (
              <Link
                href={t.bookingInfo.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-green-dark hover:text-charcoal"
              >
                <ExternalLink size={13} />
                Open link
              </Link>
            ) : null}
          </div>
        ) : null}

        {has(t.tapanNote) ? (
          <div className="mt-5 rounded-2xl bg-brand-green-light/70 px-4 py-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
              Tapan&apos;s tip
            </p>
            <p className="mt-1.5 whitespace-pre-wrap font-serif text-[16px] italic leading-relaxed text-charcoal">
              {t.tapanNote}
            </p>
          </div>
        ) : null}

        {has(t.warning) ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/5 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-terracotta" />
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-terracotta">
                Watch out
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-charcoal-soft">
                {t.warning}
              </p>
            </div>
          </div>
        ) : null}
      </article>
    </CinematicReveal>
  );
}
