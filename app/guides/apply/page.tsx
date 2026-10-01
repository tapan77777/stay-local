import Link from "next/link";
import { ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { SectionEyebrow } from "@/components/site/section";
import { buildMetadata } from "@/lib/seo";

const GOOGLE_FORM_URL = "https://forms.gle/sjmKt1JLKdRu8vKNA";

export const metadata = buildMetadata({
  title: "Apply to Become a StayLocal Guide",
  description:
    "Share where you know, how you can help travelers, and why you'd make a great StayLocal guide. We review every application personally.",
  path: "/guides/apply",
});

export default function GuideApplyPage() {
  return (
    <Container className="py-20 lg:py-28">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href={"/" as never} className="hover:text-charcoal">
              Home
            </Link>
          </li>
          <ChevronRight size={12} />
          <li>
            <Link href={"/guides" as never} className="hover:text-charcoal">
              Guides
            </Link>
          </li>
          <ChevronRight size={12} />
          <li className="text-charcoal">Apply</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <SectionEyebrow>Guide application</SectionEyebrow>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-charcoal sm:text-5xl lg:text-[52px]">
            A short form.{" "}
            <span className="italic text-brand-green">Honestly answered.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            This is how we start the conversation. Tell us where you know and
            how you&apos;d help a traveler — in your own words.
          </p>

          <p className="mt-6 max-w-md text-[14px] leading-relaxed text-charcoal-soft">
            If your application is shortlisted, we&apos;ll reach out within 7
            days to arrange a short interview.
          </p>
        </div>

        <div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(20,30,25,0.03)] sm:p-8 lg:p-10">
            <h2 className="font-serif text-3xl leading-tight text-charcoal lg:text-4xl">
              Ready to apply?
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
              The application lives in a short Google Form — about 5 minutes
              to complete. Opens in a new tab so you don&apos;t lose your
              place.
            </p>

            <ul className="mt-8 space-y-3 text-[14px] leading-relaxed text-charcoal-soft">
              <li className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                />
                A few basics — name, contact, where you&apos;re based.
              </li>
              <li className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                />
                The areas you know and the kinds of guiding you enjoy.
              </li>
              <li className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                />
                A short note in your own words about why StayLocal fits you.
              </li>
            </ul>

            <div className="mt-10 flex flex-col items-start gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-relaxed text-muted">
                Submitting the form sends your details to StayLocal for
                review.
              </p>
              <Button
                asChild
                variant="primary"
                size="xl"
                className="group w-full sm:w-auto"
              >
                <a
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apply as a StayLocal Guide
                  <ArrowRight
                    size={16}
                    className="ml-0.5 -mr-0.5 transition-transform group-hover:translate-x-0.5"
                  />
                  <ExternalLink
                    size={13}
                    aria-hidden
                    className="ml-1 opacity-70"
                  />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
