import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  MapPin,
  Clock,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading } from "@/components/site/section";
import { ExperienceCard } from "@/components/site/experience-card";
import { ConsultCta } from "@/components/site/consult-cta";
import { JsonLd } from "@/components/site/jsonld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getExperienceBySlug,
  getExperienceSlugs,
  getRelatedExperiences,
} from "@/lib/experiences";
import { buildMetadata, experienceJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getExperienceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/experiences/[slug]">) {
  const { slug } = await params;
  const e = getExperienceBySlug(slug);
  if (!e) return buildMetadata({ title: "Experience not found", path: `/experiences/${slug}` });

  const description =
    e.shortDesc ??
    e.subtitle ??
    `India travel notes for ${e.place} — honest thoughts, real budget, day-by-day.`;

  return buildMetadata({
    title: `${e.title} — ${e.place}`,
    description,
    path: `/experiences/${e.slug}`,
    image: e.heroImage ?? e.image ?? site.ogImage,
    type: "article",
  });
}

export default async function ExperienceDetailPage({
  params,
}: PageProps<"/experiences/[slug]">) {
  const { slug } = await params;
  const e = getExperienceBySlug(slug);
  if (!e) notFound();

  const hero = e.heroImage ?? e.image;
  const related = getRelatedExperiences(e.slug, 3);
  const description = e.shortDesc ?? e.subtitle ?? "";
  const isFirstHand = Boolean(e.founderNote) || (e.story?.length ?? 0) > 0;

  return (
    <>
      <JsonLd
        data={experienceJsonLd({
          title: `${e.title} — ${e.place}`,
          description,
          path: `/experiences/${e.slug}`,
          image: e.heroImage ?? e.image,
          place: e.place,
        })}
      />

      {/* Hero */}
      <section className="relative">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-warm sm:aspect-[16/8] lg:aspect-[16/7]">
          {hero && (
            <Image
              src={hero}
              alt={`${e.title} — ${e.place}`}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
          <Container className="absolute inset-x-0 bottom-0 pb-10 lg:pb-14">
            <nav aria-label="Breadcrumb" className="text-xs text-white/75">
              <ol className="flex items-center gap-2">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <ChevronRight size={12} />
                <li><Link href="/experiences" className="hover:text-white">Experiences</Link></li>
                <ChevronRight size={12} />
                <li className="text-white">{e.place}</li>
              </ol>
            </nav>
            <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-white/85">
              <MapPin size={12} className="mr-1.5 inline -translate-y-px" />
              {e.place}
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.05] text-white sm:text-5xl lg:text-[62px]">
              {e.title}
            </h1>
            {e.subtitle && (
              <p className="mt-4 max-w-2xl text-lg text-white/85">{e.subtitle}</p>
            )}
            {e.tags && e.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-white backdrop-blur"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Container>
        </div>
      </section>

      {/* Summary strip */}
      <section className="border-b border-border bg-cream">
        <Container className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryRow icon={<Clock size={16} />} label="Duration" value={e.duration ?? "Flexible"} />
          <SummaryRow icon={<Wallet size={16} />} label="Avg / day" value={e.avgPerDay ?? "—"} />
          <SummaryRow icon={<Sparkles size={16} />} label="Includes" value={e.includes ?? "—"} />
          <SummaryRow icon={<MapPin size={16} />} label="Where" value={e.place} />
        </Container>
      </section>

      {/* Story + sidebar */}
      <Section tone="cream" className="pt-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
            <article>
              {e.founderNote && (
                <blockquote className="rounded-2xl border-l-2 border-brand-green bg-brand-green-light/50 p-6 lg:p-8">
                  <p className="eyebrow">A note from Tapan</p>
                  <p className="mt-3 font-serif text-xl leading-snug text-charcoal lg:text-2xl">
                    &ldquo;{e.founderNote}&rdquo;
                  </p>
                </blockquote>
              )}

              {e.story && e.story.length > 0 && (
                <div className="mt-12">
                  <SectionEyebrow>
                    {e.founderNote ? "What I experienced" : "About this place"}
                  </SectionEyebrow>
                  <div className="prose-editorial mt-4">
                    {e.story.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              )}

              {e.days && e.days.length > 0 && (
                <div className="mt-16">
                  <SectionEyebrow>Day by day</SectionEyebrow>
                  <SectionHeading as="h2" className="mt-3 text-2xl lg:text-3xl">
                    {isFirstHand
                      ? "How the days actually went."
                      : "A suggested day-by-day."}
                  </SectionHeading>
                  <ol className="mt-8 space-y-6">
                    {e.days.map((d) => (
                      <li
                        key={d.day}
                        className="rounded-2xl border border-border bg-card p-6 lg:p-7"
                      >
                        <div className="flex items-baseline gap-4">
                          <span className="font-serif text-3xl leading-none text-brand-green">
                            {d.day.toString().padStart(2, "0")}
                          </span>
                          <div>
                            <p className="eyebrow">Day {d.day}</p>
                            <h3 className="mt-1 font-serif text-xl text-charcoal">
                              {d.title}
                            </h3>
                          </div>
                        </div>
                        <p className="mt-4 text-[15px] leading-relaxed text-charcoal-soft">
                          {d.content}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {e.tips && e.tips.length > 0 && (
                <div className="mt-16">
                  <SectionEyebrow>Local tips</SectionEyebrow>
                  <SectionHeading as="h2" className="mt-3 text-2xl lg:text-3xl">
                    {isFirstHand
                      ? "Things I'd tell a friend before they go."
                      : "Things worth knowing before you go."}
                  </SectionHeading>
                  <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                    {e.tips.map((t, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-border bg-card p-5 text-[15px] leading-relaxed text-charcoal-soft"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </article>

            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              {e.budget && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="eyebrow">
                    {isFirstHand ? "What I spent" : "Approximate cost"}
                  </p>
                  {e.budget.total && (
                    <p className="mt-2 font-serif text-3xl text-charcoal">
                      {e.budget.total}
                    </p>
                  )}
                  {e.budget.note && (
                    <p className="mt-1 text-xs text-muted">{e.budget.note}</p>
                  )}
                  {e.budget.items && e.budget.items.length > 0 && (
                    <ul className="mt-5 space-y-2.5 text-sm">
                      {e.budget.items.map((it) => (
                        <li
                          key={it.label}
                          className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0"
                        >
                          <span className="text-charcoal-soft">{it.label}</span>
                          <span className="font-medium text-charcoal">{it.amount}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-4 text-[11px] text-muted">
                    Approximate. Actual costs vary by season and choices.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-brand-green/30 bg-brand-green-light/40 p-6">
                <Badge variant="green">Want this trip?</Badge>
                <p className="mt-3 font-serif text-xl leading-tight text-charcoal">
                  Let&apos;s turn this into your India itinerary.
                </p>
                <p className="mt-2 text-sm text-muted">
                  Book a $10 call and I&apos;ll help you shape a version of
                  this trip that fits your dates, pace and travel style.
                </p>
                <div className="mt-5 space-y-2.5">
                  <ConsultCta size="md" className="w-full" />
                  <Button
                    asChild
                    variant="secondary"
                    size="md"
                    className="w-full"
                  >
                    <Link href="/services#plan" className="group">
                      Want me to plan this? — $150
                      <ArrowRight
                        size={14}
                        className="ml-0.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="warm">
          <Container>
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <SectionEyebrow>More like this</SectionEyebrow>
                <SectionHeading className="mt-3 text-2xl lg:text-3xl">
                  Other experiences you might like.
                </SectionHeading>
              </div>
              <Button asChild variant="secondary" size="md">
                <Link href="/experiences">Browse all →</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ExperienceCard key={r.slug} experience={r} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-green-light text-brand-green-dark">
        {icon}
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-charcoal">{value}</p>
      </div>
    </div>
  );
}

