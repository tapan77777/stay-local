import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { guideWhatYouDo, guideWhatYouDoNote } from "@/lib/guides";

export function GuideWhatYouDo() {
  return (
    <Section tone="warm">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <SectionEyebrow>Your role</SectionEyebrow>
            <SectionHeading className="mt-3">
              What will you actually do?
            </SectionHeading>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Guiding looks different in every city, but the shape of the day
              is simple — meet travelers where they are, share the India you
              know, keep the experience comfortable.
            </p>
          </div>

          <div>
            <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
              {guideWhatYouDo.map((item, i) => (
                <Reveal key={item} delay={i * 0.03}>
                  <li className="flex items-start gap-5 px-6 py-5 sm:px-7 sm:py-6">
                    <span className="mt-[2px] text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-green-dark">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] leading-relaxed text-charcoal">
                      {item}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>

            <p className="mt-6 text-[13px] italic leading-relaxed text-muted">
              {guideWhatYouDoNote}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
