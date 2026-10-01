import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
  SectionLede,
} from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { guideBenefits } from "@/lib/guides";

export function GuideBenefits() {
  return (
    <Section tone="cream">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>Why join StayLocal</SectionEyebrow>
          <SectionHeading className="mt-3">
            More than a guide. Be part of StayLocal.
          </SectionHeading>
          <SectionLede>
            StayLocal is building a curated network of local people who know
            India deeply — and want to share it with travelers from abroad.
          </SectionLede>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
          {guideBenefits.map((b, i) => (
            <Reveal key={b.n} delay={i * 0.05}>
              <li className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(20,30,25,0.03)] transition-shadow hover:shadow-[0_14px_40px_rgba(20,30,25,0.06)] lg:p-7">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green-dark">
                  {b.n}
                </span>
                <p className="mt-4 font-serif text-xl leading-tight text-charcoal lg:text-[22px]">
                  {b.title}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-charcoal-soft">
                  {b.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl text-[13px] italic leading-relaxed text-muted">
          Compensation depends on the assignment, destination, duration,
          relevant experience, and the rate we agree on. StayLocal does not
          guarantee earnings or booking volume.
        </p>
      </Container>
    </Section>
  );
}
