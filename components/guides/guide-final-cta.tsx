import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export function GuideFinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 320px at 15% 0%, rgba(29,158,117,0.35), transparent), radial-gradient(560px 320px at 92% 100%, rgba(228,165,58,0.16), transparent)",
        }}
      />
      <Container className="relative py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-green-light">
              Become a StayLocal Guide
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
              Know India.{" "}
              <span className="italic text-brand-green-light">
                Share it with the world.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-cream/80">
              Join the growing StayLocal guide network.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <Button
              asChild
              variant="primary"
              size="xl"
              className="group w-full max-w-sm shadow-[0_16px_40px_rgba(29,158,117,0.35)] focus-visible:ring-offset-charcoal"
            >
              <Link href={"/guides/apply" as never} className="group">
                Apply to become a StayLocal Guide
                <ArrowRight
                  size={16}
                  className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
