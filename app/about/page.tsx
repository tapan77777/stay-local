import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Mail, MessageSquare } from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";
import { JsonLd } from "@/components/site/jsonld";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { principles } from "@/lib/services";

export const metadata = buildMetadata({
  title: `About ${site.founder.name} — Personal India Travel Advisor`,
  description:
    "Meet Tapan Naik, the person behind StayLocal. Real trips across the Himalayas and beyond, honest advice for international travelers, and the story behind why StayLocal exists.",
  path: "/about",
});

function LinkedinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.founder.name,
  jobTitle: site.founder.role,
  description: site.founder.shortBio,
  url: new URL("/about", site.url).toString(),
  image: new URL("/images/tapan.jpg", site.url).toString(),
  worksFor: {
    "@type": "Organization",
    name: site.name,
    url: site.url,
  },
  sameAs: [site.social.linkedin].filter((v): v is string => Boolean(v)),
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={personJsonLd} />

      <Container className="pt-20 lg:pt-28">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-charcoal">Home</Link></li>
            <ChevronRight size={12} />
            <li className="text-charcoal">About</li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <SectionEyebrow>The person behind StayLocal</SectionEyebrow>
            <SectionHeading as="h1" className="mt-4">
              Hi, I&apos;m Tapan.
            </SectionHeading>
            <p className="mt-4 font-serif text-xl leading-snug text-brand-green-dark lg:text-2xl">
              A real traveler from India, helping people from abroad see this
              country the way it actually feels — not the way a brochure sells it.
            </p>
            <SectionLede>
              StayLocal isn&apos;t a company of ten people pretending to be
              your friend. It&apos;s me — one person, obsessed with helping
              visitors experience India the way it deserves to be experienced.
            </SectionLede>

            <div className="prose-editorial mt-10">
              <p>
                I&apos;ve spent years traveling across India — sometimes solo,
                sometimes with friends, sometimes for weeks in a single
                Himalayan village because it felt like home. Most of my time
                on the ground has been in the mountains: Himachal, Uttarakhand,
                Sikkim, the hills of West Bengal. But I&apos;ve also spent
                quiet weeks in South Goa, jungle nights in Odisha and long
                afternoons in cafés from Bir to Rishikesh.
              </p>
              <p>
                Somewhere along the way, I kept meeting international
                travelers who were struggling — great people, excited to see
                India, but stuck inside itineraries built by people who
                had never actually done the trip. They were being sold
                &ldquo;experiences&rdquo; that were tourist traps. Getting
                overcharged on the same taxis I take for a fraction. Missing
                the parts of India that would have quietly changed their
                trip.
              </p>
              <p>
                StayLocal is my answer to that. A trusted personal India
                travel advisor for people visiting from the US, UK, Europe,
                Australia — anywhere really. Real advice, real routes, real
                pricing, real me.
              </p>
              <p>
                No confusion. No hidden costs. No time wasted. That&apos;s
                the whole promise.
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream-warm">
                <Image
                  src="/images/tapan.jpg"
                  alt={`${site.founder.name} — ${site.founder.role}`}
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="p-6 lg:p-7">
                <p className="font-serif text-2xl text-charcoal">
                  {site.founder.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                  {site.founder.role}
                </p>

                <dl className="mt-6 space-y-3 text-sm">
                  <Row label="Based in" value="India" />
                  <Row
                    label="Regions I know best"
                    value="Himachal, Uttarakhand, West Bengal, Sikkim, Goa"
                  />
                  <Row label="Travel style" value="Slow, honest, local" />
                  <Row label="Best way to reach" value="WhatsApp or a $10 call" />
                </dl>

                <div className="mt-6 space-y-2.5">
                  <ConsultCta size="md" className="w-full" />
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-cream px-4 py-2 text-sm text-charcoal transition-colors hover:border-brand-green/40 hover:text-brand-green"
                  >
                    <Mail size={14} />
                    {site.contact.email}
                  </a>
                  {site.social.linkedin && (
                    <a
                      href={site.social.linkedin}
                      target="_blank"
                      rel="me noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-cream px-4 py-2 text-sm text-charcoal transition-colors hover:border-brand-green/40 hover:text-brand-green"
                    >
                      <LinkedinIcon size={14} />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* Contact block */}
      <Section tone="cream" className="border-t border-border">
        <Container size="narrow">
          <SectionEyebrow>How to reach me</SectionEyebrow>
          <SectionHeading className="mt-3">
            Three ways in. All go to the same person.
          </SectionHeading>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <ContactTile
              icon={<MessageSquare size={16} />}
              title="$10 call"
              body="60 minutes, one-to-one. The fastest way to know if I can help."
              cta="Book the call"
              href="/consultation"
            />
            <ContactTile
              icon={<Mail size={16} />}
              title="Email"
              body="For longer questions or when the timezone gap is real."
              cta={site.contact.email}
              href={`mailto:${site.contact.email}`}
            />
            {site.social.linkedin && (
              <ContactTile
                icon={<LinkedinIcon size={16} />}
                title="LinkedIn"
                body="Say hi, ask a quick question, or just see what I'm working on."
                cta="Connect on LinkedIn"
                href={site.social.linkedin}
                external
              />
            )}
          </div>
        </Container>
      </Section>

      <Section tone="warm">
        <Container size="narrow">
          <SectionEyebrow>What I promise</SectionEyebrow>
          <SectionHeading className="mt-3">
            The rules I hold every service to.
          </SectionHeading>
          <div className="mt-10 space-y-6">
            {principles.map((p) => (
              <div key={p.title} className="border-l-2 border-brand-green pl-5">
                <p className="font-serif text-2xl text-charcoal">{p.title}</p>
                <p className="mt-2 text-[15px] text-charcoal-soft">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row">
            <ConsultCta size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/experiences">Read my first-hand experiences →</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0">
      <dt className="shrink-0 text-xs uppercase tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd className="text-right text-sm text-charcoal">{value}</dd>
    </div>
  );
}

function ContactTile({
  icon,
  title,
  body,
  cta,
  href,
  external = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  href: string;
  external?: boolean;
}) {
  const linkProps = external
    ? { target: "_blank", rel: "noreferrer" as const }
    : {};
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-light text-brand-green-dark">
        {icon}
      </span>
      <p className="mt-5 font-serif text-xl text-charcoal">{title}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal-soft">
        {body}
      </p>
      <a
        href={href}
        {...linkProps}
        className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-green underline-offset-4 hover:underline"
      >
        {cta} →
      </a>
    </div>
  );
}
