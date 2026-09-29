import Link from "next/link";
import { MessageCircle, Mail, Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionEyebrow } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildMetadata, serviceJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/site/jsonld";
import { site, whatsappLink, mailtoLink } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Talk to an India Expert — $10 consultation with Tapan",
  description:
    "60 minutes, one-on-one, no package pressure. Book a $10 private India travel consultation with Tapan — honest local advice on routes, stays, transport and what to avoid.",
  path: "/consultation",
});

const whatsappMessage = `Hi Tapan, I'd like to book the $10 India travel consultation.\n\nA bit about my trip:\n- Traveling from:\n- Rough dates:\n- What I'm hoping to figure out:`;

const emailBody = `Hi Tapan,\n\nI'd like to book the $10 India travel consultation.\n\nA bit about me:\n- Traveling from:\n- Rough dates:\n- Number of travelers:\n- What I want help figuring out:\n\nThanks!`;

const askAbout = [
  "Where to go",
  "How long to stay",
  "Route & transport",
  "Hotels",
  "Things worth doing",
  "Places to avoid",
  "Your existing itinerary",
  "Anything you're unsure about",
];

export default function ConsultationPage() {
  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name: "Expert India Travel Consultation",
          description:
            "60-minute 1:1 video consultation with Tapan Naik — personal, honest India travel advice.",
          priceUsd: 10,
          path: "/consultation",
        })}
      />
      <Container className="py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <SectionEyebrow>The $10 consultation</SectionEyebrow>
            <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-charcoal sm:text-5xl lg:text-[56px]">
              Talk to an India Expert.
            </h1>
            <p className="mt-4 text-lg text-muted">
              60 minutes. One-on-one. No package pressure.
            </p>

            <div className="prose-editorial mt-8 max-w-xl">
              <p>Planning India can get confusing.</p>
              <p>
                Tell me what you&apos;re thinking, and I&apos;ll help you make
                sense of it — based on real local knowledge.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-start gap-6 rounded-2xl border border-brand-green/30 bg-brand-green-light/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:p-7">
              <div>
                <p className="font-serif text-5xl leading-none text-charcoal">
                  $10
                </p>
                <p className="mt-2 text-sm text-charcoal-soft">
                  60-minute private consultation
                </p>
              </div>
              <Button asChild variant="primary" size="xl">
                <a href="#book" className="group">
                  Choose a time
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </Button>
            </div>

            <div className="mt-14">
              <p className="eyebrow">You can ask about</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {askAbout.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[15px] text-charcoal-soft"
                  >
                    <Check
                      className="mt-1 shrink-0 text-brand-green"
                      size={16}
                      strokeWidth={2.5}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-14 rounded-2xl border border-border bg-white p-6 lg:p-7">
              <p className="eyebrow">How it works today</p>
              <ol className="mt-4 space-y-3 text-sm text-charcoal-soft">
                <Step
                  n={1}
                  text="Send a short message on WhatsApp or email with your dates and questions."
                />
                <Step
                  n={2}
                  text="Tapan replies personally within 24 hours with a call time and $10 payment link."
                />
                <Step
                  n={3}
                  text="You pay $10, we meet on video, and you leave with real answers."
                />
              </ol>
              <p className="mt-4 text-xs text-muted">
                Direct online booking with instant payment is coming shortly.
                Until then, this simple flow keeps things personal and honest.
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-28">
            <Card id="book" className="scroll-mt-28 p-8 lg:p-10">
              <Badge variant="green">Book in 30 seconds</Badge>
              <h2 className="mt-4 font-serif text-2xl leading-tight text-charcoal">
                Send a message. Tapan replies personally.
              </h2>
              <p className="mt-2 text-sm text-muted">
                Pick whichever is easier for you.
              </p>

              <div className="mt-6 space-y-3">
                <Button asChild variant="primary" size="xl" className="w-full">
                  <a
                    href={whatsappLink(whatsappMessage)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <MessageCircle size={18} />
                    Message on WhatsApp
                  </a>
                </Button>
                <Button asChild variant="secondary" size="xl" className="w-full">
                  <a href={mailtoLink("$10 India travel consultation", emailBody)}>
                    <Mail size={18} />
                    Email {site.contact.email}
                  </a>
                </Button>
              </div>

              <div className="mt-8 dotted-rule" />
              <div className="mt-6 space-y-3 text-sm text-charcoal-soft">
                <Row label="Duration" value="60 minutes" />
                <Row label="Format" value="Video call" />
                <Row label="Price" value="$10 (flat)" />
                <Row label="What you get" value="Personal advice + follow-up notes" />
              </div>

              <p className="mt-6 text-xs leading-relaxed text-muted">
                Prefer a written plan instead? See{" "}
                <Link href="/services" className="text-brand-green hover:underline">
                  all four services and pricing
                </Link>
                .
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-green-light font-serif text-xs text-brand-green-dark">
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-[0.1em] text-muted">{label}</span>
      <span className="text-sm text-charcoal">{value}</span>
    </div>
  );
}
