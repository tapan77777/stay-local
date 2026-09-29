import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Compass,
  MapPin,
  MessageCircle,
  Mountain,
  Landmark,
  UtensilsCrossed,
  Leaf,
  PawPrint,
  Waves,
  Users,
  BedDouble,
  User,
  ShieldAlert,
  MessageSquare,
  Tag,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConsultCta } from "@/components/site/consult-cta";
import { ServiceCard } from "@/components/site/service-card";
import { ExperienceCard } from "@/components/site/experience-card";
import { FounderNote } from "@/components/site/founder-note";
import { services, principles } from "@/lib/services";
import { getFeaturedExperiences } from "@/lib/experiences";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

const HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80",
  alt: "Rooftops of Jaipur at golden hour — the kind of India view first-time travelers plan a trip around",
  caption: "Rajasthan, at your pace",
  eyebrow: "Featured route",
};

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
      <PrinciplesStrip />
      <TravelStyles />
      <IndependentTravel />
      <ServicesOverview />
      <FeaturedExperiences experiences={featured} />
      <TrustMarkers />
      <FounderNote />
      <ClosingCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-20%] h-[520px] w-[520px] rounded-full bg-brand-green/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 left-[-15%] h-[420px] w-[420px] rounded-full bg-saffron/10 blur-3xl"
      />
      <Container className="relative pt-16 pb-24 sm:pt-20 lg:pt-24 lg:pb-32">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="animate-fade-in-up">
            <Badge variant="green" className="mb-6">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-green" />
              India travel, honestly
            </Badge>
            <h1 className="font-serif text-[42px] leading-[1.02] tracking-tight text-charcoal sm:text-6xl lg:text-[72px]">
              Experience India{" "}
              <span className="italic text-brand-green">your way.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted lg:text-xl">
              Real first-hand advice — local knowledge, honest recommendations,
              and what to watch out for. For travelers from the US, UK, Europe
              and Australia.
            </p>

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <ConsultCta size="xl" />
              <Link
                href="/services"
                className="group inline-flex items-center gap-2 text-sm text-charcoal underline-offset-4 hover:text-brand-green"
              >
                See all four services
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
              <li className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-green" />
                60-minute 1:1 call
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-green" />
                Personally with Tapan
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-green" />
                WhatsApp &amp; email support
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border bg-cream-warm shadow-[0_20px_60px_rgba(20,30,25,0.08)]">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                priority
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/80">
                  {HERO_IMAGE.eyebrow}
                </p>
                <p className="mt-1 font-serif text-2xl leading-tight">
                  {HERO_IMAGE.caption}
                </p>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden max-w-[240px] rounded-2xl border border-border bg-card p-4 shadow-lg sm:block">
              <p className="eyebrow">Advice, not a sales pitch</p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal">
                &ldquo;Skip the two-day Taj tour. Give me one full afternoon
                and one sunrise instead.&rdquo;
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-muted">
                — Tapan
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

const travelStyles = [
  { icon: Mountain, label: "Mountains", desc: "Himalayas, valleys, quiet passes." },
  { icon: Landmark, label: "Culture & Heritage", desc: "Old cities, forts, living traditions." },
  { icon: UtensilsCrossed, label: "Food", desc: "Street food, regional kitchens, home meals." },
  { icon: Leaf, label: "Nature", desc: "Forests, rivers, tea country, offbeat trails." },
  { icon: PawPrint, label: "Wildlife", desc: "Tigers, elephants, birds, national parks." },
  { icon: Waves, label: "Adventure", desc: "Treks, surf, dives, high-altitude drives." },
  { icon: Users, label: "Local Life", desc: "Homestays, villages, slow days with locals." },
  { icon: BedDouble, label: "Comfort", desc: "Boutique stays, private transport, easy pacing." },
];

function TravelStyles() {
  return (
    <Section tone="cream" className="border-b border-border">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>Start with what you love</SectionEyebrow>
          <SectionHeading className="mt-3">
            What kind of India are you looking for?
          </SectionHeading>
          <SectionLede>
            India is not one trip — it is many. Pick the shapes that pull you,
            and we&apos;ll build a route around them on the call.
          </SectionLede>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {travelStyles.map(({ icon: Icon, label, desc }) => (
            <li key={label}>
              <Link
                href="/consultation"
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand-green/40 hover:bg-brand-green-light/30"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-green-light text-brand-green-dark">
                  <Icon size={18} />
                </span>
                <span className="mt-4 font-serif text-lg text-charcoal">
                  {label}
                </span>
                <span className="mt-1 text-sm leading-relaxed text-muted">
                  {desc}
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-brand-green opacity-0 transition-opacity group-hover:opacity-100">
                  Plan this <ArrowRight size={12} />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-muted">
          Want more than one? Most trips mix two or three. Bring them all to
          the $10 call — we&apos;ll shape them into a real route.
        </p>
      </Container>
    </Section>
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

function PrinciplesStrip() {
  return (
    <section className="border-y border-border bg-cream-warm">
      <Container className="grid gap-8 py-10 sm:grid-cols-3 sm:py-12">
        {principles.map((p) => (
          <div key={p.title} className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
            <div>
              <p className="font-serif text-lg text-charcoal">{p.title}</p>
              <p className="mt-1 text-sm text-muted">{p.body}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
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
