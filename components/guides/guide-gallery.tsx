import Image from "next/image";
import { Container } from "@/components/site/container";
import {
  Section,
  SectionEyebrow,
  SectionHeading,
} from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { guideGallery } from "@/lib/guides";

// Image swap-ready. When real guide photos exist, drop them into
// /public/images/guides/guide-01.jpg … guide-06.jpg and update the
// `src` values on guideGallery in lib/guides.ts.
export function GuideGallery() {
  return (
    <Section tone="cream" className="border-y border-border">
      <Container>
        <div className="max-w-2xl">
          <SectionEyebrow>The people</SectionEyebrow>
          <SectionHeading className="mt-3">
            Meet the people behind StayLocal.
          </SectionHeading>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            The India that lives behind the brochure — told by the people who
            grew up with it.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {guideGallery.map((item, i) => {
            const tall = i === 0 || i === 3;
            return (
              <Reveal key={item.src + i} delay={i * 0.05}>
                <li className="group relative overflow-hidden rounded-3xl bg-cream-warm">
                  <div
                    className={
                      tall
                        ? "relative aspect-[4/5] w-full"
                        : "relative aspect-[4/3] w-full"
                    }
                  >
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
                    />
                    <p className="absolute inset-x-0 bottom-0 px-5 py-5 font-serif text-base leading-tight text-white sm:px-6 sm:text-lg">
                      {item.caption}
                    </p>
                  </div>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
