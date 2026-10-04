"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";

/*
 * Shared top-of-module header. Every module page uses this so the hierarchy
 * stays consistent: back-link → destination eyebrow → module title → intro.
 */

export interface ModuleHeaderProps {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  intro?: string;
}

export function ModuleHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  intro,
}: ModuleHeaderProps) {
  return (
    <CinematicReveal
      y={14}
      className="mx-auto max-w-2xl px-5 pt-6 sm:px-6 sm:pt-10 lg:pt-6"
    >
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark transition-colors hover:text-charcoal"
      >
        <ArrowLeft size={13} />
        {backLabel}
      </Link>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-serif text-[32px] leading-[1.08] tracking-tight text-charcoal sm:text-[40px] lg:text-[44px]">
        {title}
      </h1>
      {intro ? (
        <p className="mt-3 font-serif text-[16px] italic leading-relaxed text-charcoal-soft sm:text-[17px]">
          {intro}
        </p>
      ) : null}
    </CinematicReveal>
  );
}
