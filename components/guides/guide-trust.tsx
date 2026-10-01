import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
  SectionLede,
} from "@/components/site/section";
import { guideTrustChecks, guideTrustNote } from "@/lib/guides";

export function GuideTrust() {
  return (
    <Section tone="warm">
      <Container size="narrow">
        <SectionEyebrow>Trust & review</SectionEyebrow>
        <SectionHeading className="mt-3">
          Why travelers trust their guide matters.
        </SectionHeading>
        <SectionLede>
          Travelers come to StayLocal because the people they meet on the
          ground are the point. We take time to understand everyone who joins
          the network.
        </SectionLede>

        <div className="mt-12 space-y-6">
          {guideTrustChecks.map((c) => (
            <div
              key={c.title}
              className="border-l-2 border-brand-green pl-5"
            >
              <p className="font-serif text-xl text-charcoal">{c.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal-soft">
                {c.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[13px] italic leading-relaxed text-muted">
          {guideTrustNote}
        </p>
      </Container>
    </Section>
  );
}
