import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { guideAssignmentProcess } from "@/lib/guides";

export function GuideAssignmentProcess() {
  return (
    <Section tone="warm">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>Assignments</SectionEyebrow>
          <SectionHeading className="mt-3">
            How assignments work.
          </SectionHeading>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            Every assignment follows the same path, from the moment a traveler
            books with StayLocal to the day you meet them on the ground.
          </p>
        </div>

        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {guideAssignmentProcess.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.04}>
              <li className="relative flex h-full flex-col rounded-3xl border border-border bg-card p-6 lg:p-7">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-[42px] leading-none text-brand-green/25 lg:text-[48px]">
                    {s.n}
                  </span>
                </div>
                <p className="mt-4 font-serif text-[18px] leading-tight text-charcoal lg:text-xl">
                  {s.title}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-charcoal-soft">
                  {s.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
