"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ExperienceCard } from "@/components/site/experience-card";
import type { Experience } from "@/lib/experiences";
import { extractState } from "@/lib/experiences";
import { cn } from "@/lib/utils";

const priorityTags = [
  "Mountains",
  "Trek",
  "Snow",
  "Cafes",
  "Offbeat",
  "Solo Travel",
  "Homestay",
  "Village Life",
  "Beach",
  "Wildlife",
];

export function ExperienceFilter({
  experiences,
  allTags,
  allStates,
}: {
  experiences: Experience[];
  allTags: string[];
  allStates: string[];
}) {
  const [tag, setTag] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const orderedTags = useMemo(() => {
    const known = new Set(allTags);
    const p = priorityTags.filter((t) => known.has(t));
    const rest = allTags.filter((t) => !p.includes(t));
    return [...p, ...rest];
  }, [allTags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiences.filter((e) => {
      if (tag && !(e.tags ?? []).includes(tag)) return false;
      if (state && extractState(e.place) !== state) return false;
      if (q) {
        const hay = `${e.title} ${e.place} ${e.shortDesc ?? ""} ${(e.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [experiences, tag, state, query]);

  const activeCount = (tag ? 1 : 0) + (state ? 1 : 0) + (query.trim() ? 1 : 0);

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              placeholder="Search Jibhi, Kerala, homestay…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-full border border-border bg-cream pl-10 pr-4 text-sm text-charcoal placeholder:text-muted focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="state">
              Filter by state
            </label>
            <select
              id="state"
              value={state ?? ""}
              onChange={(e) => setState(e.target.value || null)}
              className="h-11 rounded-full border border-border bg-cream px-4 text-sm text-charcoal focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="">All states</option>
              {allStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTag(null);
                  setState(null);
                  setQuery("");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal"
              >
                <X size={12} />
                Clear ({activeCount})
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <TagPill active={tag === null} onClick={() => setTag(null)}>
            All experiences
          </TagPill>
          {orderedTags.map((t) => (
            <TagPill key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
              {t}
            </TagPill>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <p>
          Showing <span className="text-charcoal">{filtered.length}</span> of{" "}
          {experiences.length} experiences
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-serif text-2xl text-charcoal">
            No experiences match that yet.
          </p>
          <p className="mt-2 text-sm text-muted">
            Try a different tag or region — or just ask Tapan directly.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e, i) => (
            <ExperienceCard key={e.slug} experience={e} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}

function TagPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-brand-green bg-brand-green text-white"
          : "border-border bg-cream text-charcoal-soft hover:border-charcoal/30"
      )}
    >
      {children}
    </button>
  );
}
