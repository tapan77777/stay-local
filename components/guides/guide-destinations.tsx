import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { getAllStates } from "@/lib/experiences";

export function GuideDestinations() {
  const states = getAllStates();

  return (
    <Section tone="cream" className="border-y border-border">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>Where we&apos;re building the network</SectionEyebrow>
          <SectionHeading className="mt-3">
            Guide network — growing across India.
          </SectionHeading>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
            These are the regions StayLocal is currently exploring on the
            ground. We&apos;re open to applications from across India —
            including states not listed below.
          </p>
        </div>

        <ul className="mt-12 flex flex-wrap gap-2.5 sm:gap-3">
          {states.map((state) => (
            <li
              key={state}
              className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-charcoal-soft"
            >
              {state}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
