import Link from "next/link";
import {
  Compass,
  MapPin,
  User,
  ShieldAlert,
  MessageSquare,
  Tag,
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading } from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";
import { ExperiencesRail } from "@/components/site/experiences-rail";
import { FounderNote } from "@/components/site/founder-note";
import { Hero } from "@/components/site/hero";
import { IndependentTravel } from "@/components/site/independent-travel";
import { Reveal } from "@/components/site/reveal";
import { ServicesSelector } from "@/components/site/services-selector";
import { TravelStyles } from "@/components/site/travel-styles";
import { JsonLd } from "@/components/site/jsonld";
import { getFeaturedExperiences } from "@/lib/experiences";
import { buildMetadata, orgJsonLd } from "@/lib/seo";
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
      <JsonLd data={orgJsonLd()} />
      <Hero />
      <IndependentTravel />
      <TravelStyles />
      <FounderNote />
      <ExperiencesRail experiences={featured} />
      <ServicesSelector />
      <Reveal>
        <TrustMarkers />
      </Reveal>
      <Reveal>
        <ClosingCta />
      </Reveal>
    </>
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
