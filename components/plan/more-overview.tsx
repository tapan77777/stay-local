"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  Clock,
  Compass,
  Wallet,
  Sparkles,
  AlertCircle,
  LifeBuoy,
} from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import {
  formatTripRange,
  pluralizeNights,
  tripLengthDays,
  whatsappHref,
} from "@/lib/plan/format";
import type { PlanDocument, PlanWithCustomer } from "@/lib/plan/types";

/*
 * More — the catch-all area for everything that doesn't fit on the trip home
 * or a destination hub. Progressive-disclosure rule: a section is only
 * rendered when its underlying field has content. No empty labels, no "N/A".
 *
 * Documents may ship without a hosted file (admin stage) — in that case the
 * row renders as a description-only card with a WhatsApp fallback instead of
 * a dead download button. Never render a broken file link.
 */

export interface MoreOverviewProps {
  token: string;
  plan: PlanWithCustomer;
  documents: PlanDocument[];
  totalNights: number;
}

export function MoreOverview({
  token,
  plan,
  documents,
  totalNights,
}: MoreOverviewProps) {
  const wa = whatsappHref(
    plan.whatsappContact,
    `Hi Tapan — question about my trip (${plan.title})`
  );
  const waDocuments = whatsappHref(
    plan.whatsappContact,
    `Hi Tapan — can you resend the trip documents for ${plan.title}?`
  );
  const dateLine = formatTripRange(plan.startDate, plan.endDate);
  const days = tripLengthDays(plan.startDate, plan.endDate, plan.tripDays);
  const nightsLine = totalNights > 0 ? pluralizeNights(totalNights) : "";

  const overviewRows: { icon: typeof CalendarDays; label: string; value: string }[] =
    [];
  if (dateLine) {
    overviewRows.push({ icon: CalendarDays, label: "Dates", value: dateLine });
  }
  const spanBits: string[] = [];
  if (days != null) spanBits.push(`${days} day${days === 1 ? "" : "s"}`);
  if (nightsLine) spanBits.push(nightsLine);
  if (spanBits.length) {
    overviewRows.push({
      icon: Clock,
      label: "Length",
      value: spanBits.join(" · "),
    });
  }
  if (plan.travelStyle) {
    overviewRows.push({
      icon: Compass,
      label: "Travel style",
      value: plan.travelStyle,
    });
  }
  if (plan.budgetStyle) {
    overviewRows.push({
      icon: Wallet,
      label: "Budget style",
      value: plan.budgetStyle,
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14 lg:py-10">
      <CinematicReveal y={14}>
        <Link
          href={`/plan/${token}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark hover:text-charcoal"
        >
          <ArrowLeft size={13} />
          Back to trip home
        </Link>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          More
        </p>
        <h1 className="mt-3 font-serif text-[30px] leading-[1.08] tracking-tight text-charcoal sm:text-[36px]">
          Everything in one place.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal-soft">
          Your documents, trip essentials, and the fastest way to reach me.
        </p>
      </CinematicReveal>

      {documents.length > 0 ? (
        <section aria-labelledby="more-documents" className="mt-10">
          <CinematicReveal y={10}>
            <h2
              id="more-documents"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark"
            >
              Documents
            </h2>
          </CinematicReveal>
          <ul className="mt-4 space-y-3">
            {documents.map((doc, i) => {
              const hasFile = doc.fileUrl.trim().length > 0;
              return (
                <CinematicReveal key={doc.id} y={10} delay={0.05 + i * 0.03}>
                  <DocumentRow
                    doc={doc}
                    hasFile={hasFile}
                    waFallback={waDocuments}
                  />
                </CinematicReveal>
              );
            })}
          </ul>
        </section>
      ) : null}

      {overviewRows.length > 0 ? (
        <section aria-labelledby="more-overview" className="mt-10">
          <CinematicReveal y={10}>
            <h2
              id="more-overview"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark"
            >
              Trip overview
            </h2>
          </CinematicReveal>
          <ul className="mt-4 overflow-hidden rounded-2xl border border-border bg-white">
            {overviewRows.map((row, i) => (
              <CinematicReveal
                key={row.label}
                y={6}
                delay={0.04 + i * 0.02}
                className="block"
              >
                <li
                  className={
                    "flex items-start gap-4 px-4 py-4 sm:px-5" +
                    (i > 0 ? " border-t border-border" : "")
                  }
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
                    <row.icon size={14} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {row.label}
                    </span>
                    <span className="mt-1 block text-[14.5px] leading-snug text-charcoal">
                      {row.value}
                    </span>
                  </span>
                </li>
              </CinematicReveal>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.specialPreferences ? (
        <InfoBlock
          icon={Sparkles}
          eyebrow="Your preferences"
          body={plan.specialPreferences}
        />
      ) : null}

      {plan.importantNotes ? (
        <InfoBlock
          icon={AlertCircle}
          eyebrow="Important notes"
          body={plan.importantNotes}
        />
      ) : null}

      {plan.supportInfo ? (
        <InfoBlock
          icon={LifeBuoy}
          eyebrow="How to reach Tapan"
          body={plan.supportInfo}
        />
      ) : null}

      {wa ? (
        <CinematicReveal y={14} className="mt-12">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <p className="font-serif text-[18px] leading-snug text-charcoal">
              Need anything, any time?
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-charcoal-soft">
              WhatsApp is the fastest. I&rsquo;ll see your message and reply as
              soon as I can.
            </p>
            <Link
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark"
            >
              <MessageCircle size={14} />
              Message Tapan on WhatsApp
            </Link>
          </div>
        </CinematicReveal>
      ) : null}
    </div>
  );
}

function DocumentRow({
  doc,
  hasFile,
  waFallback,
}: {
  doc: PlanDocument;
  hasFile: boolean;
  waFallback: string | null;
}) {
  // Downloadable doc: tappable card linking out. External PDF URLs open in a
  // new tab so the plan session stays live underneath.
  if (hasFile) {
    return (
      <Link
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-green/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:p-5"
      >
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
          <FileText size={16} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[17px] leading-tight text-charcoal">
            {doc.title}
          </span>
          {doc.description ? (
            <span className="mt-1 block text-[13px] leading-snug text-muted">
              {doc.description}
            </span>
          ) : null}
          <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-green-dark">
            <Download size={12} /> Download
          </span>
        </span>
        <ExternalLink
          size={14}
          className="mt-1 shrink-0 text-brand-green-dark opacity-70 transition-transform group-hover:translate-x-1 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        />
      </Link>
    );
  }

  // No file attached (seed/admin pre-upload state). Render the title + copy as
  // a non-clickable info card. Offer WhatsApp as the obvious next step so the
  // traveler never hits a dead UI.
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
        <FileText size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[17px] leading-tight text-charcoal">
          {doc.title}
        </p>
        {doc.description ? (
          <p className="mt-1 text-[13px] leading-snug text-muted">
            {doc.description}
          </p>
        ) : null}
        {waFallback ? (
          <Link
            href={waFallback}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-green-dark hover:text-charcoal"
          >
            <MessageCircle size={12} />
            Ask Tapan to send
            <ArrowRight size={11} />
          </Link>
        ) : (
          <p className="mt-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Tapan will send this on WhatsApp
          </p>
        )}
      </div>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  eyebrow,
  body,
}: {
  icon: typeof CalendarDays;
  eyebrow: string;
  body: string;
}) {
  return (
    <section className="mt-10">
      <CinematicReveal y={10}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          {eyebrow}
        </h2>
      </CinematicReveal>
      <CinematicReveal y={10} delay={0.05} className="mt-4 block">
        <div className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
            <Icon size={14} strokeWidth={1.8} />
          </span>
          <p className="min-w-0 flex-1 whitespace-pre-wrap text-[14.5px] leading-relaxed text-charcoal-soft">
            {body}
          </p>
        </div>
      </CinematicReveal>
    </section>
  );
}
