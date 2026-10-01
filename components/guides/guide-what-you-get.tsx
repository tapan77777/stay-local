import { Check } from "lucide-react";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
  SectionLede,
} from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { guideWhatYouGet, guideWhatYouGetNote } from "@/lib/guides";

export function GuideWhatYouGet() {
  return (
    <Section tone="cream">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>What you get</SectionEyebrow>
          <SectionHeading className="mt-3">
            What you get on an assignment.
          </SectionHeading>
          <SectionLede>
            Every assignment comes with clear terms — written down, agreed up
            front and never improvised halfway through.
          </SectionLede>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {guideWhatYouGet.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.05}>
              <li className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(20,30,25,0.03)] transition-shadow hover:shadow-[0_14px_40px_rgba(20,30,25,0.06)] lg:p-7">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-light text-brand-green-dark">
                  <Check size={16} strokeWidth={2.5} />
                </span>
                <p className="mt-5 font-serif text-xl leading-tight text-charcoal lg:text-[22px]">
                  {item.title}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-charcoal-soft">
                  {item.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl text-[13px] italic leading-relaxed text-muted">
          {guideWhatYouGetNote}
        </p>
      </Container>
    </Section>
  );
}
