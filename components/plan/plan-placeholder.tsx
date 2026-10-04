"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import { whatsappHref } from "@/lib/plan/format";

/*
 * Transitional placeholder for the nav slots whose dedicated screens land in
 * later Phase 3 milestones (Map, Guide, More). Rendered as a full
 * destination-screen-shaped block so the shell doesn't collapse to nothing
 * when a traveler taps a nav item we haven't shipped yet.
 */

export interface PlanPlaceholderProps {
  token: string;
  eyebrow: string;
  title: string;
  description: string;
  whatsappContact?: string | null;
  tripTitle?: string;
}

export function PlanPlaceholder({
  token,
  eyebrow,
  title,
  description,
  whatsappContact,
  tripTitle,
}: PlanPlaceholderProps) {
  const wa = whatsappHref(
    whatsappContact ?? "",
    tripTitle
      ? `Hi Tapan — question about my trip (${tripTitle})`
      : "Hi Tapan"
  );
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
          {eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-[30px] leading-[1.08] tracking-tight text-charcoal sm:text-[36px]">
          {title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal-soft">
          {description}
        </p>
        {wa ? (
          <Link
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark"
          >
            <MessageCircle size={14} />
            Message Tapan on WhatsApp
          </Link>
        ) : null}
      </CinematicReveal>
    </div>
  );
}
