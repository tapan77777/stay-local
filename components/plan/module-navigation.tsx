"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import { whatsappHref } from "@/lib/plan/format";

/*
 * Previous / next *module* navigation + destination-return + optional
 * WhatsApp fallback. Rendered once at the bottom of every module page so a
 * traveler never dead-ends.
 */

export interface ModuleNavLink {
  label: string;
  caption: string;
  href: string;
}

export interface ModuleNavigationProps {
  prev: ModuleNavLink | null;
  next: ModuleNavLink | null;
  destinationHref: string;
  destinationName: string;
  whatsappContact?: string | null;
  tripTitle?: string;
  helpTitle?: string;
}

export function ModuleNavigation({
  prev,
  next,
  destinationHref,
  destinationName,
  whatsappContact,
  tripTitle,
  helpTitle,
}: ModuleNavigationProps) {
  const wa = whatsappHref(
    whatsappContact ?? "",
    tripTitle
      ? `Hi Tapan — question about ${destinationName} on my trip (${tripTitle})`
      : `Hi Tapan — question about ${destinationName}`,
  );

  return (
    <section className="mx-auto mt-14 max-w-2xl px-5 sm:px-6">
      {(prev || next) ? (
        <CinematicReveal y={10}>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {prev ? (
              <Link
                href={prev.href}
                className="group flex flex-1 items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-green/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              >
                <ArrowLeft
                  size={16}
                  className="shrink-0 text-brand-green-dark transition-transform group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {prev.caption}
                  </span>
                  <span className="block truncate font-serif text-[16px] text-charcoal">
                    {prev.label}
                  </span>
                </span>
              </Link>
            ) : (
              <div className="hidden flex-1 sm:block" aria-hidden />
            )}
            {next ? (
              <Link
                href={next.href}
                className="group flex flex-1 items-center gap-3 rounded-2xl border border-border bg-white p-4 text-right transition-colors hover:border-brand-green/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {next.caption}
                  </span>
                  <span className="block truncate font-serif text-[16px] text-charcoal">
                    {next.label}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-brand-green-dark transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </Link>
            ) : (
              <div className="hidden flex-1 sm:block" aria-hidden />
            )}
          </div>
        </CinematicReveal>
      ) : null}

      <CinematicReveal y={10} delay={0.05} className="mt-5">
        <Link
          href={destinationHref}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-green-dark transition-colors hover:text-charcoal"
        >
          <ArrowLeft size={13} />
          Back to {destinationName}
        </Link>
      </CinematicReveal>

      {wa ? (
        <CinematicReveal y={10} delay={0.08} className="mt-6">
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-brand-green-light/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-[16.5px] text-charcoal">
                {helpTitle ?? `Something unclear about ${destinationName}?`}
              </p>
              <p className="mt-1 text-[13px] text-charcoal-soft">
                Message me on WhatsApp — I usually reply within a few hours.
              </p>
            </div>
            <Link
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark"
            >
              <MessageCircle size={14} />
              Message Tapan
            </Link>
          </div>
        </CinematicReveal>
      ) : null}
    </section>
  );
}
