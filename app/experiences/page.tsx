import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading, SectionLede } from "@/components/site/section";
import { ExperienceFilter } from "@/components/site/experience-filter";
import { ConsultCta } from "@/components/site/consult-cta";
import { getAllExperiences, getAllStates, getAllTags } from "@/lib/experiences";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "India Travel Experiences — First-hand notes by Tapan",
  description:
    "First-hand India travel notes from Tapan — Himalayan valleys, high-altitude treks, mountain villages, hill cafés, jungle and coast. Honest advice on what to do, what to skip, and what to expect.",
  path: "/experiences",
});

export default function ExperiencesPage() {
  const experiences = getAllExperiences();
  const tags = getAllTags();
  const states = getAllStates();

  return (
    <>
      <Container className="pt-20 lg:pt-24">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-charcoal">Home</Link></li>
            <ChevronRight size={12} />
            <li className="text-charcoal">Experiences</li>
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl">
          <SectionEyebrow>First-hand India</SectionEyebrow>
          <SectionHeading as="h1" className="mt-4">
            Places I&apos;ve been. Notes I&apos;d give a friend.
          </SectionHeading>
          <SectionLede>
            These are the actual trips behind StayLocal — mostly Himalayan
            valleys and treks, with a jungle, a coast and a few hill cafés
            worth writing home about. Read the honest version: what I loved,
            what I&apos;d avoid, what to spend on, and who each place is
            actually for.
          </SectionLede>
        </div>
      </Container>

      <Section tone="cream" className="pt-14">
        <Container>
          <ExperienceFilter
            experiences={experiences}
            allTags={tags}
            allStates={states}
          />
        </Container>
      </Section>

      <Section tone="warm">
        <Container size="narrow" className="text-center">
          <SectionEyebrow>Planning a trip?</SectionEyebrow>
          <SectionHeading className="mt-3">
            Turn any of these into your own India itinerary.
          </SectionHeading>
          <SectionLede className="mx-auto text-center">
            Book a $10 call and we&apos;ll build a route around the
            experiences that actually fit you.
          </SectionLede>
          <div className="mt-8 flex justify-center">
            <ConsultCta size="xl" />
          </div>
        </Container>
      </Section>
    </>
  );
}
