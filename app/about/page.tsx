import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { principles } from "@/lib/services";

export const metadata = buildMetadata({
  title: `About ${site.founder.name} — Personal India Travel Advisor`,
  description:
    "Meet Tapan Naik, the person behind StayLocal. Real trips across India, honest advice for international travelers, and the story behind why StayLocal exists.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
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
            <SectionLede>
              StayLocal isn&apos;t a company of ten people pretending to be
              your friend. It&apos;s me — a real traveler, from India,
              obsessed with helping visitors experience this country the way
              it deserves to be experienced.
            </SectionLede>

            <div className="prose-editorial mt-10">
              <p>
                I&apos;ve spent years traveling across India — sometimes solo,
                sometimes with friends, sometimes for weeks in a single
                village because it felt like home. I&apos;ve slept in
                homestays in Himachal, taken sleeper buses through Rajasthan,
                gotten lost in Old Delhi, drunk chai at 6am on Andaman
                beaches, and eaten too much in South Indian tiffin homes.
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

          <aside className="rounded-3xl border border-border bg-card p-8 lg:sticky lg:top-28">
            <div className="aspect-square overflow-hidden rounded-2xl bg-cream-warm">
              <div className="grid h-full place-items-center p-8 text-center">
                <div>
                  <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-brand-green text-white">
                    <span className="font-serif text-4xl">T</span>
                  </span>
                  <p className="mt-6 font-serif text-2xl text-charcoal">
                    {site.founder.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                    {site.founder.role}
                  </p>
                  <p className="mt-3 text-xs text-muted">
                    Real photos coming soon.
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Based in" value="India" />
              <Row label="Regions I know well" value="Himachal, Rajasthan, Kerala, Andaman, Karnataka" />
              <Row label="Travel style" value="Slow, honest, local" />
              <Row label="Best way to reach" value="WhatsApp or a $10 call" />
            </dl>

            <div className="mt-6">
              <ConsultCta size="md" className="w-full" />
            </div>
          </aside>
        </div>
      </Container>

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
