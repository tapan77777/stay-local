"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Smartphone,
  Bus,
  Users,
  Info,
  ShieldAlert,
  PlaneLanding,
  Backpack,
  Siren,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import { whatsappHref } from "@/lib/plan/format";
import {
  GUIDE_CATEGORY_LABEL,
  type GuideCategory,
  type IndiaGuideItem,
} from "@/lib/plan/types";

/*
 * India Guide — detail view.
 *
 * Full reading experience for a single guide item: back link, category
 * eyebrow, serif title, long-form prose, and a WhatsApp CTA at the end. The
 * content column is prose-width so a traveler can read without eye-tracking
 * across the full viewport on a phone.
 */

const CATEGORY_ICON: Record<GuideCategory, LucideIcon> = {
  ARRIVAL: PlaneLanding,
  MONEY: Wallet,
  SIM: Smartphone,
  TRANSPORT: Bus,
  PACKING: Backpack,
  CULTURE: Users,
  SCAMS: ShieldAlert,
  PRACTICAL: Info,
  EMERGENCY: Siren,
};

export interface IndiaGuideDetailProps {
  token: string;
  item: IndiaGuideItem;
  whatsappContact: string | null;
  tripTitle: string;
}

export function IndiaGuideDetail({
  token,
  item,
  whatsappContact,
  tripTitle,
}: IndiaGuideDetailProps) {
  const Icon = CATEGORY_ICON[item.category];
  const wa = whatsappHref(
    whatsappContact,
    `Hi Tapan — question about "${item.title}" (${tripTitle})`
  );
  const paragraphs = item.content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14 lg:py-10">
      <CinematicReveal y={14}>
        <Link
          href={`/plan/${token}/guide`}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark hover:text-charcoal"
        >
          <ArrowLeft size={13} />
          Back to India guide
        </Link>
        <div className="mt-6 flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
            <Icon size={15} strokeWidth={1.8} />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
            {GUIDE_CATEGORY_LABEL[item.category]}
          </p>
        </div>
        <h1 className="mt-3 font-serif text-[28px] leading-[1.1] tracking-tight text-charcoal sm:text-[34px]">
          {item.title}
        </h1>
      </CinematicReveal>

      <CinematicReveal y={14} delay={0.08} className="mt-6">
        <div className="space-y-4 text-[15.5px] leading-relaxed text-charcoal-soft lg:text-base">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {p}
              </p>
            ))
          ) : (
            <p className="whitespace-pre-wrap">{item.content}</p>
          )}
        </div>
      </CinematicReveal>

      {wa ? (
        <CinematicReveal y={14} delay={0.14} className="mt-10">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <p className="font-serif text-[17px] leading-snug text-charcoal">
              Still have a question?
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-charcoal-soft">
              Message me and I&rsquo;ll walk you through it.
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
