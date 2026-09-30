import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  MessageSquare,
  Route,
  Compass,
} from "lucide-react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
  SectionLede,
} from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";
import { JsonLd } from "@/components/site/jsonld";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { services, principles, type ServiceTier } from "@/lib/services";
import { buildMetadata, faqJsonLd, serviceJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Services — Four honest paths through India",
  description:
    "Four ways to plan your India trip with Tapan: a $10 expert consultation, a $150 India Plan, curated India with a personal local guide, and a fully organized India trip. Real inclusions, clear scope, no hidden fees.",
  path: "/services",
});

const howItWorks = [
  {
    n: "01",
    icon: MessageSquare,
    title: "Tell me about your trip",
    body:
      "Book a $10 call or send a WhatsApp message. Share your dates, interests and doubts — no form-filling, just a conversation.",
  },
  {
    n: "02",
    icon: Route,
    title: "Pick the level of help you want",
    body:
      "One call. A full plan. Plan plus a personal local guide. Or the whole trip planned and booked end-to-end.",
  },
  {
    n: "03",
    icon: Compass,
    title: "Travel with a real person in your corner",
    body:
      "WhatsApp reach before and during your trip. Honest answers when things get confusing — because they will.",
  },
];

// "Who this is for" / "What you still handle" — derived strictly from each
// service's own `bestFor` and the inverse of its `includes` array. No claims
// invented beyond what services.ts already promises.
type ServiceDeepDive = {
  id: ServiceTier["id"];
  whoItsFor: string;
  youStillHandle: string[];
};

const deepDives: Record<ServiceTier["id"], ServiceDeepDive> = {
  consultation: {
    id: "consultation",
    whoItsFor:
      "Travelers who want honest, unbiased answers before committing to a plan or a booking. If you're stuck between three routes, unsure what's a scam, or just want a real person to sanity-check your India trip — start here.",
    youStillHandle: [
      "Booking your own accommodation and transport",
      "Building the day-by-day itinerary yourself",
      "On-the-ground logistics once you land",
    ],
  },
  plan: {
    id: "plan",
    whoItsFor:
      "Independent travelers who want a real, personal India itinerary — not a generic tour brochure. You'll do the bookings yourself, but with a plan that actually fits how you travel.",
    youStillHandle: [
      "Booking stays, buses, trains and flights yourself",
      "On-the-ground translation and navigation",
      "Reaching out on WhatsApp when questions come up",
    ],
  },
  "local-help": {
    id: "local-help",
    whoItsFor:
      "First-time visitors who want the plan and a real human they can reach when things get confusing. Great for solo travelers, couples, or anyone who wants a trusted local person on the ground without booking a full curated trip.",
    youStillHandle: [
      "Booking your own accommodation and transport (with recommendations)",
      "Everyday logistics — but with a local person a message away",
    ],
  },
  curated: {
    id: "curated",
    whoItsFor:
      "Travelers who want their India trip planned, booked and organized end-to-end. You show up with your bag; everything else is handled and quoted transparently.",
    youStillHandle: [
      "Showing up on the dates we agree",
      "Being open to the pace we scope together on the discovery call",
    ],
  },
};

const servicesFaqs = [
  {
    q: "Do I have to book the $10 call first?",
    a: "No, but almost everyone does. It's the fastest way to know which of the four services actually fits — instead of guessing from a page.",
  },
  {
    q: "Can I upgrade later from a plan to curated?",
    a: "Yes. If you've already done the $10 call or Your India Plan, that work becomes context for the curated scoping — you're not starting from zero. How that carries into the curated quote is something we'll discuss directly before you commit.",
  },
  {
    q: "Do you plan trips outside India?",
    a: "No. StayLocal is India-only, by design. The advice is first-hand — I only sell what I've actually traveled.",
  },
  {
    q: "What if my dates or plans change?",
    a: "Reach out on WhatsApp. Plans get updated. Curated trips get re-scoped. The relationship is with a real person, not a booking form.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={[
          ...services.map((s) =>
            serviceJsonLd({
              name: s.name,
              description: s.tagline,
              priceUsd: s.priceUsd,
              path: `/services#${s.id}`,
            })
          ),
          faqJsonLd(servicesFaqs),
        ]}
      />

      <Container className="pt-20 lg:pt-28">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-charcoal">Home</Link>
            </li>
            <ChevronRight size={12} />
            <li className="text-charcoal">Services</li>
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl">
          <SectionEyebrow>Services</SectionEyebrow>
          <SectionHeading as="h1" className="mt-4">
            Four honest paths through India.{" "}
            <span className="italic text-brand-green">Pick your level of help.</span>
          </SectionHeading>
          <SectionLede>
            One person. Four services. Real time on the ground behind every
            recommendation. Start with a $10 call — or scope a trip that&apos;s
            planned and booked end-to-end.
          </SectionLede>
        </div>

        {/* In-page anchor nav */}
        <nav
          aria-label="Jump to a service"
          className="mt-10 flex flex-wrap gap-2"
        >
          {services.map((s) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-[12px] text-charcoal-soft transition-colors hover:border-brand-green/40 hover:text-brand-green"
            >
              {s.name}
              <span className="ml-2 text-[11px] text-muted">{s.price}</span>
            </Link>
          ))}
        </nav>
      </Container>

      {/* How it works */}
      <Section tone="cream" className="pt-16">
        <Container>
          <div className="max-w-2xl">
            <SectionEyebrow>How StayLocal works</SectionEyebrow>
            <SectionHeading className="mt-3">
              Three steps. No forms. No quiz funnel.
            </SectionHeading>
          </div>
          <ol className="mt-10 grid gap-6 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <Reveal key={step.n} delay={0.05}>
                <Card className="flex h-full flex-col p-7">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-light text-brand-green-dark">
                      <step.icon size={18} />
                    </span>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
                      {step.n}
                    </p>
                  </div>
                  <p className="mt-5 font-serif text-xl text-charcoal">
                    {step.title}
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-charcoal-soft">
                    {step.body}
                  </p>
                </Card>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Deep-dive per service — every tier gets Who / Receive / Handle */}
      <Section tone="warm">
        <Container>
          <div className="max-w-2xl">
            <SectionEyebrow>The four services in detail</SectionEyebrow>
            <SectionHeading className="mt-3">
              What each one includes — and what you still handle.
            </SectionHeading>
            <SectionLede>
              Everything below is the actual promise. Nothing invented, nothing
              hidden. Prices and inclusions match the pricing page exactly.
            </SectionLede>
          </div>

          {(() => {
            const consultation = services.find((s) => s.id === "consultation");
            const planning = services.filter((s) => s.id !== "consultation");
            return (
              <div className="mt-14">
                {consultation && (
                  <ServiceDeepDiveBlock
                    service={consultation}
                    dive={deepDives[consultation.id]}
                  />
                )}
                <div
                  aria-hidden
                  className="mx-auto mt-14 flex max-w-lg items-center gap-4 lg:mt-20"
                >
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
                    Planning services
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="mt-14 space-y-14 lg:space-y-20">
                  {planning.map((s) => (
                    <ServiceDeepDiveBlock
                      key={s.id}
                      service={s}
                      dive={deepDives[s.id]}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </Container>
      </Section>

      {/* Principles */}
      <Section tone="cream" className="border-t border-border">
        <Container size="narrow">
          <SectionEyebrow>Principles</SectionEyebrow>
          <SectionHeading className="mt-3">
            What every StayLocal service holds itself to.
          </SectionHeading>
          <div className="mt-10 space-y-6">
            {principles.map((p) => (
              <div key={p.title} className="border-l-2 border-brand-green pl-5">
                <p className="font-serif text-2xl text-charcoal">{p.title}</p>
                <p className="mt-2 text-[15px] text-charcoal-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="warm">
        <Container size="narrow">
          <SectionEyebrow>Common questions</SectionEyebrow>
          <SectionHeading className="mt-3">
            Before you book, the things people ask.
          </SectionHeading>
          <dl className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {servicesFaqs.map((f) => (
              <div key={f.q} className="p-6 lg:p-7">
                <dt className="font-serif text-lg text-charcoal">{f.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-charcoal-soft">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-14 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ConsultCta size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/pricing">
                Compare pricing side-by-side
                <ArrowRight size={16} className="ml-0.5" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

function ServiceDeepDiveBlock({
  service,
  dive,
}: {
  service: ServiceTier;
  dive: ServiceDeepDive;
}) {
  return (
    <article
      id={service.id}
      className={cn(
        "scroll-mt-28 overflow-hidden rounded-3xl border border-border bg-card",
        service.emphasized &&
          "border-2 border-brand-green/50 bg-brand-green-light/30 shadow-[0_18px_50px_rgba(29,158,117,0.12)] ring-1 ring-brand-green/15"
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
        <div className="p-8 lg:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
            {service.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-charcoal lg:text-4xl">
            {service.name}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            {service.tagline}
          </p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-4xl text-charcoal lg:text-[44px]">
              {service.price}
            </span>
            <span className="text-xs text-muted">{service.duration}</span>
          </div>
          {service.priceNote && (
            <p className="mt-1.5 text-[12px] italic text-muted">
              {service.priceNote}
            </p>
          )}

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
                Who this is for
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal-soft">
                {dive.whoItsFor}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
                What you receive
              </p>
              <ul className="mt-3 space-y-2">
                {service.includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[15px] leading-relaxed text-charcoal-soft"
                  >
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className="mt-[3px] shrink-0 text-brand-green"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-charcoal/50">
                What you still handle
              </p>
              <ul className="mt-3 space-y-2">
                {dive.youStillHandle.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-relaxed text-charcoal-soft"
                  >
                    <span
                      aria-hidden
                      className="mt-[9px] block h-[1.5px] w-3 shrink-0 rounded-full bg-charcoal/25"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-8 border-t border-border bg-cream-warm/50 p-8 lg:border-l lg:border-t-0 lg:p-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
              Best for
            </p>
            <p className="mt-2 font-serif text-xl leading-snug text-charcoal">
              {service.bestFor}
            </p>
          </div>

          <div>
            <Button
              asChild
              variant={service.emphasized ? "primary" : "secondary"}
              size="lg"
              className="w-full"
            >
              <Link href={service.ctaHref as never} className="group">
                {service.ctaLabel}
                <ArrowRight
                  size={16}
                  className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted">
              Or ask Tapan first —{" "}
              <Link
                href="/consultation"
                className="text-brand-green underline-offset-4 hover:underline"
              >
                book the $10 call
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}
