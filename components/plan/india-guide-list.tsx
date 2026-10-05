"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
 * India Guide — list view.
 *
 * One row per guide item, grouped by category. Each row shows a category icon,
 * the item title, and a short teaser from the first line of the content. Tap
 * opens the detail route for the full reading experience. Progressive
 * disclosure: the landing stays scannable while the long-form prose lives one
 * tap in.
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

// Category display order on the list page. Follows the trip arc: before you
// land → in-pocket essentials → social fluency → safety nets.
const CATEGORY_ORDER: GuideCategory[] = [
  "ARRIVAL",
  "MONEY",
  "SIM",
  "TRANSPORT",
  "PACKING",
  "CULTURE",
  "SCAMS",
  "PRACTICAL",
  "EMERGENCY",
];

function teaserFromContent(content: string): string {
  const firstPara = content.trim().split(/\n\s*\n/, 1)[0] ?? "";
  const singleLine = firstPara.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 110) return singleLine;
  return `${singleLine.slice(0, 108).trimEnd()}…`;
}

export interface IndiaGuideListProps {
  token: string;
  items: IndiaGuideItem[];
  whatsappContact: string | null;
  tripTitle: string;
}

export function IndiaGuideList({
  token,
  items,
  whatsappContact,
  tripTitle,
}: IndiaGuideListProps) {
  const wa = whatsappHref(
    whatsappContact,
    `Hi Tapan — question about my India guide (${tripTitle})`
  );

  const grouped = new Map<GuideCategory, IndiaGuideItem[]>();
  for (const item of items) {
    const bucket = grouped.get(item.category) ?? [];
    bucket.push(item);
    grouped.set(item.category, bucket);
  }
  const sections = CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => ({
    category: c,
    items: grouped.get(c)!,
  }));

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
          India guide
        </p>
        <h1 className="mt-3 font-serif text-[30px] leading-[1.08] tracking-tight text-charcoal sm:text-[36px]">
          Everything to know before you fly.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-charcoal-soft">
          Money, SIMs, transport basics, cultural etiquette, scams to sidestep,
          and what to pack — the things that don&rsquo;t belong to a single
          destination. Tap any card to read in detail.
        </p>
      </CinematicReveal>

      {sections.map((section, sIdx) => (
        <section
          key={section.category}
          aria-labelledby={`guide-${section.category.toLowerCase()}`}
          className="mt-10"
        >
          <CinematicReveal y={10} delay={0.04 + sIdx * 0.02}>
            <h2
              id={`guide-${section.category.toLowerCase()}`}
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark"
            >
              {GUIDE_CATEGORY_LABEL[section.category]}
            </h2>
          </CinematicReveal>
          <ul className="mt-4 space-y-3">
            {section.items.map((item, i) => {
              const Icon = CATEGORY_ICON[item.category];
              const teaser = teaserFromContent(item.content);
              return (
                <CinematicReveal
                  key={item.id}
                  y={10}
                  delay={0.06 + sIdx * 0.02 + i * 0.03}
                >
                  <Link
                    href={`/plan/${token}/guide/${item.id}`}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-4 transition-colors hover:border-brand-green/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green sm:p-5"
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-warm text-brand-green-dark">
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-[17px] leading-tight text-charcoal">
                        {item.title}
                      </span>
                      {teaser ? (
                        <span className="mt-1 block text-[13px] leading-snug text-muted">
                          {teaser}
                        </span>
                      ) : null}
                    </span>
                    <ArrowRight
                      size={15}
                      className="mt-1 shrink-0 text-brand-green-dark opacity-70 transition-transform group-hover:translate-x-1 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    />
                  </Link>
                </CinematicReveal>
              );
            })}
          </ul>
        </section>
      ))}

      {wa ? (
        <CinematicReveal y={14} className="mt-12">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <p className="font-serif text-[18px] leading-snug text-charcoal">
              Something not covered here?
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-charcoal-soft">
              Message me on WhatsApp and I&rsquo;ll answer directly — anything
              from visa paperwork to what to tip your driver.
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
