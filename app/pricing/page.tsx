import Link from "next/link";
import { Check, ChevronRight, Minus } from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";
import { ServiceCard } from "@/components/site/service-card";
import { services } from "@/lib/services";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Pricing — Clear India travel planning prices, no surprises",
  description:
    "Transparent India travel planning pricing. $10 consultation, $150 India plan, $150–$300 plan with local help, $1,000+ fully curated India trips. Real inclusions, no hidden fees.",
  path: "/pricing",
});

const rows = [
  { label: "60-minute 1:1 call with Tapan", values: [true, true, true, true] },
  { label: "Personalized itinerary", values: [false, true, true, true] },
  { label: "Recommended stays, food, experiences", values: [false, true, true, true] },
  { label: "Transport guidance", values: [false, true, true, true] },
  { label: "Scam & tourist-trap awareness", values: [true, true, true, true] },
  { label: "Google Maps + useful links", values: [false, true, true, true] },
  { label: "WhatsApp support during trip", values: [false, true, true, true] },
  { label: "Trusted local person on the ground", values: [false, false, true, true] },
  { label: "Translation help when needed", values: [false, false, true, true] },
  { label: "Stays booked for you", values: [false, false, false, true] },
  { label: "Transport booked for you", values: [false, false, false, true] },
  { label: "Guides and activities arranged", values: [false, false, false, true] },
];

export default function PricingPage() {
  return (
    <>
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
            We do not do surprise fees. You&apos;ll see exactly what each
            service costs and exactly what it includes — before you book
            anything.
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

          {/* Comparison table (desktop) — a full side-by-side of every inclusion */}
          <div className="mt-16 hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
            <div className="border-b border-border bg-cream-warm px-6 py-4">
              <p className="eyebrow">Side-by-side</p>
              <p className="mt-1 font-serif text-lg text-charcoal">
                Every inclusion, compared.
              </p>
            </div>
            <table className="w-full text-left">
              <thead className="border-b border-border bg-cream-warm/60 text-xs uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th className="w-2/5 px-6 py-4 font-medium">What&apos;s included</th>
                  {services.map((s) => (
                    <th key={s.id} className="px-6 py-4 font-medium text-charcoal">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr
                    key={r.label}
                    className={cn(
                      "border-b border-border last:border-0",
                      ri % 2 === 1 && "bg-cream-warm/40"
                    )}
                  >
                    <td className="px-6 py-3.5 text-sm text-charcoal">{r.label}</td>
                    {r.values.map((v, i) => (
                      <td key={i} className="px-6 py-3.5">
                        {v ? (
                          <Check size={16} strokeWidth={2.5} className="text-brand-green" />
                        ) : (
                          <Minus size={16} className="text-muted/50" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      <Section tone="warm">
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
