import Link from "next/link";
import {
  Compass,
  MapPin,
  MessageCircle,
  User,
  ShieldAlert,
  MessageSquare,
  Tag,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { ConsultCta } from "@/components/site/consult-cta";
import { ServiceCard } from "@/components/site/service-card";
import { ExperienceCard } from "@/components/site/experience-card";
import { FounderNote } from "@/components/site/founder-note";
import { Hero } from "@/components/site/hero";
import { Reveal } from "@/components/site/reveal";
import { TravelStyles } from "@/components/site/travel-styles";
import { services } from "@/lib/services";
import { getFeaturedExperiences } from "@/lib/experiences";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = buildMetadata({
  title: `${site.name} — ${site.tagline}`,
  description:
    "Personal India travel advisor for travelers from the USA, UK, Europe and Australia. Real first-hand advice — local knowledge, honest recommendations, and what to watch out for. Book a $10 consultation with Tapan.",
  path: "/",
});

export default function HomePage() {
  const featured = getFeaturedExperiences(6);

  return (
    <>
      <Hero />
      <Reveal>
        <IndependentTravel />
      </Reveal>
      <TravelStyles />
      <Reveal>
        <FounderNote />
      </Reveal>
      <Reveal>
        <FeaturedExperiences experiences={featured} />
      </Reveal>
      <Reveal>
        <ServicesOverview />
      </Reveal>
      <Reveal>
        <TrustMarkers />
      </Reveal>
      <Reveal>
        <ClosingCta />
      </Reveal>
    </>
  );
}

function IndependentTravel() {
  return (
    <Section tone="warm">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <SectionEyebrow>Travel your way</SectionEyebrow>
            <SectionHeading className="mt-3">
              You don&apos;t need to join a tour.
            </SectionHeading>
            <div className="prose-editorial mt-5 max-w-xl">
              <p>
                Most travelers arriving in India feel they need to buy a
                packaged tour to make it work. You don&apos;t.
              </p>
              <p>
                Travel independently. Move at your own pace, stop where you
                want, stay where you like. StayLocal handles the parts that
                are hard from outside India — planning, local knowledge,
                someone to reach when things get confusing.
              </p>
              <p>
                You keep the freedom. We handle the friction.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                title: "You choose the pace",
                body: "No fixed group, no shared bus. Your dates, your route, your stops.",
              },
              {
                title: "We plan the route",
                body: "A real itinerary shaped around your travel style — not a brochure.",
              },
              {
                title: "Local help when needed",
                body: "WhatsApp support, and a trusted local on the ground if you want one.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <p className="font-serif text-lg text-charcoal">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

const trustMarkers = [
  { icon: User, title: "A real person", body: "You talk to Tapan. Not a team, not a bot." },
  { icon: Compass, title: "First-hand knowledge", body: "Advice from places actually traveled, not just researched." },
  { icon: MapPin, title: "Local insight", body: "Neighborhoods, food, stays and pacing from someone who lives here." },
  { icon: ShieldAlert, title: "What to watch out for", body: "Common scams, tourist traps and false economies — flagged early." },
  { icon: MessageSquare, title: "WhatsApp support", body: "Reach us before and during your trip — the way locals actually communicate." },
  { icon: Tag, title: "Clear pricing", body: "Every service has a price on the site. No surprise fees on the ground." },
];

function TrustMarkers() {
  return (
    <Section tone="cream" className="border-y border-border">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>Why travelers trust StayLocal</SectionEyebrow>
          <SectionHeading className="mt-3">
            Six things you can count on.
          </SectionHeading>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustMarkers.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-brand-green-dark">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-serif text-lg text-charcoal">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function ServicesOverview() {
  const iconFor: Record<string, React.ReactNode> = {
    consultation: <MessageCircle size={18} />,
    plan: <Compass size={18} />,
    "local-help": <MapPin size={18} />,
    curated: <Sparkles size={18} />,
  };

  return (
    <Section tone="cream" className="border-b border-border">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>Four ways I help</SectionEyebrow>
          <SectionHeading className="mt-3">
            From a $10 conversation to a trip planned end-to-end.
          </SectionHeading>
          <SectionLede>
            Not everyone needs the same thing. Start with a call, or go all
            the way to a fully curated trip. You pick — and you know the
            price up front.
          </SectionLede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((s) => (
            <div key={s.id} className="flex flex-col">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-light text-brand-green-dark">
                {iconFor[s.id]}
              </div>
              <ServiceCard service={s} compact />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Not sure where to start? Book the $10 call. You&apos;ll leave with
            a clear picture — even if you don&apos;t book anything else.
          </p>
          <div className="flex flex-wrap gap-3">
            <ConsultCta size="md" />
            <Button asChild variant="secondary" size="md">
              <Link href="/pricing">See full pricing →</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function FeaturedExperiences({
  experiences,
}: {
  experiences: ReturnType<typeof getFeaturedExperiences>;
}) {
  return (
    <Section tone="warm">
      <Container>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <SectionEyebrow>First-hand experiences</SectionEyebrow>
            <SectionHeading className="mt-3">
              Places I&apos;ve been. Notes I&apos;d give a friend.
            </SectionHeading>
            <SectionLede>
              Real trips, honest notes — what to do, what to skip, what to
              avoid, and what most travel blogs won&apos;t tell you.
            </SectionLede>
          </div>
          <Button asChild variant="secondary" size="md">
            <Link href="/experiences">Browse all experiences →</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((e, i) => (
            <ExperienceCard key={e.slug} experience={e} priority={i < 3} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 300px at 20% 0%, rgba(29,158,117,0.35), transparent), radial-gradient(500px 300px at 90% 100%, rgba(228,165,58,0.18), transparent)",
        }}
      />
      <Container className="relative py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-brand-green-light">
              The $10 conversation
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
              Talk to an India Expert.{" "}
              <span className="text-brand-green-light">$10.</span>{" "}
              <span className="italic text-cream/80">Really.</span>
            </h2>
            <p className="mt-6 max-w-xl text-cream/70">
              A 60-minute video call, one-to-one with Tapan. Bring your dates
              and your doubts. Leave with a clear picture of your India trip
              — routes, budget, and what to watch out for.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <ConsultCta size="xl" className="w-full max-w-sm" />
            <Link
              href="/services"
              className="text-sm text-cream/70 underline-offset-4 hover:text-cream hover:underline"
            >
              Or see all four services →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
