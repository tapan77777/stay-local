import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

// Image swap-ready. When a dedicated guide hero photo exists at
// /public/images/guides/guide-hero.jpg, update HERO_IMAGE below.
const HERO_IMAGE = "/images/travel-styles/mountains.jpg";

export function GuideHero() {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal text-cream">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-75"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,20,16,0.35) 0%, rgba(10,20,16,0.55) 55%, rgba(10,20,16,0.90) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(10,20,16,0.72), rgba(10,20,16,0) 65%)",
        }}
      />

      <Container className="relative flex min-h-[640px] flex-col justify-end py-24 sm:min-h-[680px] lg:min-h-[760px] lg:py-32">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-green-light">
            Become a StayLocal Guide
          </p>
          <h1 className="mt-5 font-serif text-[44px] leading-[1.02] tracking-tight sm:text-6xl lg:text-[80px]">
            Share the India{" "}
            <span className="italic text-brand-green-light">you know.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">
            Join a curated network of local guides across India. Help
            travelers from around the world experience the country through
            your eyes — the places, stories and small moments only you can
            share.
          </p>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              variant="primary"
              size="xl"
              className="group shadow-[0_16px_40px_rgba(29,158,117,0.35)] focus-visible:ring-offset-charcoal"
            >
              <Link href={"/guides/apply" as never} className="group">
                Apply to become a StayLocal Guide
                <ArrowRight
                  size={16}
                  className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Button>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-cream/85 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
            >
              How it works
              <ChevronDown
                size={14}
                className="transition-transform group-hover:translate-y-0.5"
              />
            </a>
          </div>

          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-8 text-cream/80">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green-light">
                Travelers
              </dt>
              <dd className="mt-2 font-serif text-lg leading-tight text-white lg:text-xl">
                From abroad
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green-light">
                Notice
              </dt>
              <dd className="mt-2 font-serif text-lg leading-tight text-white lg:text-xl">
                ~7 days
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-green-light">
                Terms
              </dt>
              <dd className="mt-2 font-serif text-lg leading-tight text-white lg:text-xl">
                Agreed up front
              </dd>
            </div>
          </dl>
        </div>
      </Container>
    </section>
  );
}
