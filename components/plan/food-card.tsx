"use client";

import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { CinematicReveal } from "@/components/site/motion-primitives";
import type { Food } from "@/lib/plan/types";

export interface FoodCardProps {
  food: Food;
  index: number;
}

function has(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

export function FoodCard({ food, index }: FoodCardProps) {
  const meta: string[] = [];
  if (has(food.category)) meta.push(food.category);
  if (has(food.location)) meta.push(food.location);
  if (has(food.priceCategory)) meta.push(food.priceCategory);

  return (
    <CinematicReveal y={16} delay={0.03 + index * 0.03} className="block">
      <article className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(20,30,25,0.04)]">
        {has(food.imageUrl) ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-warm sm:aspect-[16/10]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={food.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              sizes="(min-width: 640px) 672px, 100vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
            />
          </div>
        ) : null}
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <h3 className="font-serif text-[26px] leading-[1.1] tracking-tight text-charcoal line-clamp-3 sm:text-[30px]">
            {food.name}
          </h3>
          {meta.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              {meta.map((m, i) => (
                <span key={`${m}-${i}`} className="inline-flex items-center gap-2">
                  {i > 0 ? <span aria-hidden>·</span> : null}
                  <span>{m}</span>
                </span>
              ))}
            </p>
          ) : null}

          {has(food.whyRecommended) ? (
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal/80 sm:text-[15.5px]">
              {food.whyRecommended}
            </p>
          ) : null}

          {has(food.whatToTry) ? (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
                What to order
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal-soft">
                {food.whatToTry}
              </p>
            </div>
          ) : null}

          {has(food.tapanNote) ? (
            <div className="mt-5 rounded-2xl bg-brand-green-light/70 px-4 py-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-brand-green-dark">
                Tapan&apos;s tip
              </p>
              <p className="mt-1.5 whitespace-pre-wrap font-serif text-[16px] italic leading-relaxed text-charcoal">
                {food.tapanNote}
              </p>
            </div>
          ) : null}

          {has(food.mapUrl) ? (
            <div className="mt-6">
              <Link
                href={food.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-green-dark transition-colors hover:text-charcoal"
              >
                <MapPin size={14} />
                View on map
                <ArrowUpRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                />
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    </CinematicReveal>
  );
}
