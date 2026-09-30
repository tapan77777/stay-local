import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";
import { ServiceCard } from "@/components/site/service-card";
import { Reveal } from "@/components/site/reveal";
import { JsonLd } from "@/components/site/jsonld";
import { services, comparisonMatrix } from "@/lib/services";
import { buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing — Clear India travel planning prices, no surprises",
  description:
    "Transparent India travel planning pricing. $10 consultation, $150 India plan, $150–$300 curated India with a personal local guide, $1,000+ fully curated India trips. Real inclusions, no hidden fees.",
  path: "/pricing",
});

const pricingFaqs = [
  {
    q: "Is $10 really the full price of a consultation?",
    a: "Yes. A 60-minute one-to-one call with Tapan is $10 — no upsell required. Most people book the call first to see if a plan or curated trip even makes sense for them.",
  },
  {
    q: "How soon do I get my India Plan after paying?",
    a: "Your India Plan and Curated India + Personal Local Guide are delivered within 5–7 days of a scoping call. If your trip dates are tight, mention it up front so we can prioritize.",
  },
  {
    q: "What decides the $150–$300 range for the local guide service?",
    a: "It scales with trip length and complexity — how many regions you're covering, how many days a local person is with you, and how much translation or navigation help you actually need on the ground.",
  },
  {
    q: "Why is the Fully Curated India trip a range instead of a fixed price?",
    a: "It's quoted after a discovery call. Cost depends on trip length, region, accommodation tier and how much on-trip local support you want. You'll see the full breakdown before committing.",
  },
  {
    q: "How does pricing work if you book things on my behalf?",
    a: "The planning fees on this page are what you pay up front. For a Fully Curated India trip, anything booked on your behalf is scoped and quoted during the discovery call — you'll see the breakdown before anything is committed. Ask on the $10 call if you want to walk through the mechanics first.",
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(pricingFaqs)} />
      <Container className="pt-20 lg:pt-28">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-charcoal">Home</Link></li>
            <ChevronRight size={12} />
            <li className="text-charcoal">Pricing</li>
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl">
          <SectionEyebrow>Transparent pricing</SectionEyebrow>
          <SectionHeading as="h1" className="mt-4">
            Every price. Every inclusion. On one page.
          </SectionHeading>
          <SectionLede>
            No surprise fees. You&apos;ll see exactly what each service costs
            and exactly what it includes — before you book anything.
          </SectionLede>
        </div>
      </Container>

      <Section tone="cream" className="pt-14">
        <Container>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} compact />
            ))}
          </div>

          <Reveal>
            <PricingComparisonTable />
          </Reveal>
        </Container>
      </Section>

      <Section tone="warm">
        <Container size="narrow">
          <SectionEyebrow>Pricing FAQ</SectionEyebrow>
          <SectionHeading className="mt-3">
            The questions travelers ask before they book.
          </SectionHeading>
          <dl className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {pricingFaqs.map((f) => (
              <div key={f.q} className="p-6 lg:p-7">
                <dt className="font-serif text-lg text-charcoal">{f.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-charcoal-soft">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section tone="cream" className="border-t border-border">
        <Container size="narrow">
          <SectionEyebrow>Not sure yet?</SectionEyebrow>
          <SectionHeading className="mt-3">
            Start with a call. Decide after.
          </SectionHeading>
          <SectionLede>
            The $10 conversation exists exactly for this. Get honest,
            first-hand answers on a call — then decide if a plan or curated
            trip is the right next step for you.
          </SectionLede>
          <div className="mt-8">
            <ConsultCta size="xl" />
          </div>
        </Container>
      </Section>
    </>
  );
}

function PricingComparisonTable() {
  return (
    <div className="mt-16">
      <div className="max-w-2xl">
        <SectionEyebrow>Side by side</SectionEyebrow>
        <SectionHeading className="mt-3 text-2xl lg:text-3xl">
          Every inclusion, compared.
        </SectionHeading>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Scroll horizontally on mobile — the first column stays put so you
          can trace each row across all four services.
        </p>
      </div>

      <div className="mt-8 overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-card px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted"
              >
                What&apos;s included
              </th>
              {services.map((s, i) => (
                <th
                  key={s.id}
                  scope="col"
                  className="px-4 py-4 text-center align-bottom"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
                    {`0${i + 1}`}
                  </div>
                  <div className="mt-1 font-serif text-[14px] leading-tight text-charcoal lg:text-[15px]">
                    {s.name}
                  </div>
                  <div className="mt-1 text-[12px] text-charcoal/70">
                    {s.price}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonMatrix.map((row) => (
              <tr key={row.label} className="border-b border-border/60 last:border-b-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card px-5 py-3.5 text-[13px] font-normal leading-snug text-charcoal-soft"
                >
                  {row.label}
                </th>
                {row.support.map((yes, j) => (
                  <td key={j} className="px-4 py-3.5 text-center">
                    {yes ? (
                      <Check
                        size={16}
                        strokeWidth={2.5}
                        className="mx-auto text-brand-green"
                        aria-label="Included"
                      />
                    ) : (
                      <span
                        aria-label="Not included"
                        className="text-charcoal/20"
                      >
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
