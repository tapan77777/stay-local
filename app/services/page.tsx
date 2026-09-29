import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { ServiceCard } from "@/components/site/service-card";
import { ConsultCta } from "@/components/site/consult-cta";
import { JsonLd } from "@/components/site/jsonld";
import { Button } from "@/components/ui/button";
import { services, principles } from "@/lib/services";
import { buildMetadata, serviceJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Services — Four honest ways to plan your India trip",
  description:
    "From a $10 expert consultation to a fully curated India trip. Personalized India travel planning by Tapan Naik — clear inclusions, clear prices, no hidden costs.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={services.map((s) =>
          serviceJsonLd({
            name: s.name,
            description: s.tagline,
            priceUsd: s.priceUsd,
            path: `/services#${s.id}`,
          })
        )}
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
          <SectionEyebrow>Services & pricing</SectionEyebrow>
          <SectionHeading as="h1" className="mt-4">
            Four ways to plan your India trip.{" "}
            <span className="italic text-brand-green">No confusion.</span>
          </SectionHeading>
          <SectionLede>
            Every service is built around a real person — Tapan — and real
            time on the ground in India. Start with a $10 call, or go all the
            way to a fully organized trip.
          </SectionLede>
        </div>
      </Container>

      <Section tone="cream" className="pt-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="warm">
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

          <div className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <ConsultCta size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/pricing">Compare pricing →</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
