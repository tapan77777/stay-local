"use client";

import { useEffect } from "react";

/*
 * Plan route error boundary.
 *
 * Catches any uncaught error that bubbles from a page/segment inside the
 * authenticated plan tree. Kept intentionally short and human — a traveler
 * shouldn't see a stack trace or a technical name. Logs the error to the
 * console so Tapan can trace it from the browser if a customer screenshots.
 */

export default function PlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[plan] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-warm px-5 py-12 text-charcoal">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
          Something hiccupped
        </p>
        <h1 className="mt-3 font-serif text-[26px] leading-[1.15] text-charcoal sm:text-[30px]">
          I couldn&rsquo;t load this part of your trip just now.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-charcoal/80">
          A refresh usually sorts it. If it keeps happening, message me on
          WhatsApp and I&rsquo;ll take a look.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-green px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
