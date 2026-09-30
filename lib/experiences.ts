import raw from "@/content/experiences/experiences.json";

export type ExperienceDay = {
  day: number;
  title: string;
  content: string;
};

export type ExperienceBudget = {
  total?: string;
  note?: string;
  items?: { label: string; amount: string }[];
};

export type Experience = {
  slug: string;
  place: string;
  title: string;
  subtitle?: string;
  shortDesc?: string;
  tags?: string[];
  image?: string;
  heroImage?: string;
  founderNote?: string;
  story?: string[];
  days?: ExperienceDay[];
  tips?: string[];
  budget?: ExperienceBudget;
  relatedTripSlug?: string;
  duration?: string;
  avgPerDay?: string;
  includes?: string;
};

function normalizeImagePath(src: string | undefined): string | undefined {
  if (!src) return src;
  const trimmed = src.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
  const stripped = trimmed.replace(/^\.\/+/, "").replace(/^\/+/, "");
  return `/${stripped}`;
}

const all: Experience[] = (raw as Experience[]).map((e) => ({
  ...e,
  image: normalizeImagePath(e.image),
  heroImage: normalizeImagePath(e.heroImage),
}));

export function getAllExperiences(): Experience[] {
  return all.filter((e) => e && e.slug && e.title);
}

export function getExperienceSlugs(): string[] {
  return getAllExperiences().map((e) => e.slug);
}

export function getExperienceBySlug(slug: string): Experience | undefined {
  return getAllExperiences().find((e) => e.slug === slug);
}

export function getRelatedExperiences(slug: string, count = 3): Experience[] {
  const current = getExperienceBySlug(slug);
  if (!current) return getAllExperiences().slice(0, count);
  const tags = new Set(current.tags ?? []);
  const state = extractState(current.place);
  // Tags weigh more than state so related feels like similar *experiences*
  // (mountains, trek, cafes) not just similar geography — the corpus is
  // heavily Himalayan and state-dominant scoring collapses variety.
  const scored = getAllExperiences()
    .filter((e) => e.slug !== slug)
    .map((e) => {
      let score = 0;
      for (const t of e.tags ?? []) if (tags.has(t)) score += 3;
      if (extractState(e.place) === state) score += 1;
      return { e, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((x) => x.e);
}

export function extractState(place: string | undefined): string {
  if (!place) return "";
  const parts = place.split(",").map((p) => p.trim());
  return parts[parts.length - 1] ?? "";
}

export function getAllTags(): string[] {
  const s = new Set<string>();
  for (const e of getAllExperiences()) for (const t of e.tags ?? []) s.add(t);
  return Array.from(s).sort();
}

export function getAllStates(): string[] {
  const s = new Set<string>();
  for (const e of getAllExperiences()) {
    const st = extractState(e.place);
    if (st) s.add(st);
  }
  return Array.from(s).sort();
}

export const featuredExperienceSlugs = [
  "jibhi-shoja",
  "dharamkot",
] as const;

export function getFeaturedExperiences(count = 6): Experience[] {
  const featured: Experience[] = [];
  for (const slug of featuredExperienceSlugs) {
    const e = getExperienceBySlug(slug);
    if (e) featured.push(e);
  }
  const rest = getAllExperiences().filter(
    (e) => !featured.find((f) => f.slug === e.slug)
  );
  return [...featured, ...rest].slice(0, count);
}
