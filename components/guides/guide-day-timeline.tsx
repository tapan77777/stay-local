import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { guideDay } from "@/lib/guides";

export function GuideDayTimeline() {
  return (
    <Section tone="cream">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>A day as a guide</SectionEyebrow>
          <SectionHeading className="mt-3">
            A day with StayLocal.
          </SectionHeading>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            Example day — actual schedules vary by assignment, destination and
            what the travelers want from their time with you.
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-3xl">
          {guideDay.map((item, i) => {
            const isLast = i === guideDay.length - 1;
            return (
              <Reveal key={item.time} delay={i * 0.05}>
                <li className="relative flex gap-6 pb-10 sm:gap-8">
                  <div className="flex w-16 shrink-0 flex-col items-end sm:w-20">
                    <span className="font-mono text-[13px] font-medium tabular-nums text-brand-green-dark sm:text-[14px]">
                      {item.time}
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <span
                      aria-hidden
                      className="absolute -left-[29px] top-[6px] h-3 w-3 rounded-full border-2 border-brand-green bg-cream sm:-left-[33px]"
                    />
                    {!isLast && (
                      <span
                        aria-hidden
                        className="absolute -left-[24px] top-[18px] bottom-[-40px] w-px bg-border sm:-left-[28px]"
                      />
                    )}
                    <p className="font-serif text-xl leading-tight text-charcoal lg:text-[22px]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-charcoal-soft">
                      {item.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}
