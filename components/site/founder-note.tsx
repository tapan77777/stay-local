import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { Container } from "@/components/site/container";
import { Section, SectionEyebrow, SectionHeading } from "@/components/site/section";
import { ConsultCta } from "@/components/site/consult-cta";
import { site } from "@/lib/site";

type FounderPhoto = {
  src: string;
  alt: string;
  caption?: string;
};

const founderPortrait: FounderPhoto | null = null;

const founderGallery: FounderPhoto[] = [];

const galleryPlaceholders = [
  "Himachal — the mountains I keep going back to",
  "Coastal Karnataka — quiet coves, honest food",
  "A homestay morning — the kind of trip I want you to have",
];

export function FounderNote() {
  return (
    <Section tone="warm">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <FounderPortrait />
          </div>

          <div className="order-1 lg:order-2">
            <SectionEyebrow>Meet Tapan — your India expert</SectionEyebrow>
            <SectionHeading className="mt-3">
              Personal India travel advice, from someone who actually travels India.
            </SectionHeading>

            <div className="prose-editorial mt-6">
              <p>
                I&apos;m {site.founder.name}. I&apos;ve spent years traveling
                across India — mountains in Himachal, coasts in Karnataka and
                Goa, villages, cities, the quiet places in between. Most of
                what I recommend, I&apos;ve slept in, eaten at, or walked
                through myself.
              </p>
              <p>
                StayLocal exists because I got tired of watching travelers
                land in India excited, and leave overwhelmed — overbooked
                packages, scam taxis, generic itineraries, advice that
                clearly no one had lived.
              </p>
              <p>
                When you book a call or a plan, you talk to me. Not a team,
                not a bot. That is the whole point.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ConsultCta size="lg" />
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 text-sm text-charcoal underline-offset-4 hover:text-brand-green"
              >
                More about Tapan
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        <FounderGallery />
      </Container>
    </Section>
  );
}

function FounderPortrait() {
  if (founderPortrait) {
    return (
      <div className="relative aspect-[4/5] w-full max-w-[380px] overflow-hidden rounded-3xl border border-border bg-cream-warm shadow-[0_20px_60px_rgba(20,30,25,0.08)]">
        <Image
          src={founderPortrait.src}
          alt={founderPortrait.alt}
          fill
          sizes="(min-width: 1024px) 380px, 90vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full max-w-[380px] overflow-hidden rounded-3xl border border-border bg-cream-warm">
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <span className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-brand-green text-white">
            <span className="font-serif text-5xl">T</span>
          </span>
          <p className="mt-6 font-serif text-2xl text-charcoal">
            {site.founder.name}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
            {site.founder.role}
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted">
            <ImageIcon size={12} />
            Real portrait coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

function FounderGallery() {
  const hasPhotos = founderGallery.length > 0;

  return (
    <div className="mt-16 border-t border-border pt-10">
      <div className="flex items-baseline justify-between gap-4">
        <SectionEyebrow>From my own trips</SectionEyebrow>
        {!hasPhotos && (
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
            Real photos coming soon
          </span>
        )}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {hasPhotos
          ? founderGallery.map((photo) => (
              <figure
                key={photo.src}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-cream-warm"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 90vw"
                  className="object-cover"
                />
                {photo.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-[11px] uppercase tracking-[0.1em] text-white/90">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))
          : galleryPlaceholders.map((label) => (
              <div
                key={label}
                className="relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-dashed border-border bg-cream-warm p-4"
              >
                <ImageIcon size={16} className="text-muted/60" />
                <p className="mt-3 text-xs leading-snug text-muted">{label}</p>
              </div>
            ))}
      </div>
    </div>
  );
}
