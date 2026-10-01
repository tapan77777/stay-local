import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { guideApplicationSteps } from "@/lib/guides";

export function GuideHowItWorks() {
  return (
    <Section tone="warm" id="how-it-works" className="scroll-mt-28">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>How it works</SectionEyebrow>
          <SectionHeading className="mt-3">
            From application to your first assignment.
          </SectionHeading>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guideApplicationSteps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05}>
              <li className="relative flex h-full flex-col rounded-3xl border border-border bg-card p-7">
                <span className="font-serif text-[56px] leading-none text-brand-green/20 lg:text-[64px]">
                  {s.n}
                </span>
                <p className="mt-4 font-serif text-xl leading-tight text-charcoal lg:text-[22px]">
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
