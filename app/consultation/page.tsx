import Link from "next/link";
import { MessageCircle, Mail, Check } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionEyebrow } from "@/components/site/section";
import { BookConsultationButton } from "@/components/site/book-consultation-button";
import { JsonLd } from "@/components/site/jsonld";
import { buildMetadata, serviceJsonLd } from "@/lib/seo";
import { site, whatsappLink, mailtoLink } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Talk to an India Expert — $10 consultation with Tapan",
  description:
    "60 minutes, one-on-one, no package pressure. Book a $10 private India travel consultation with Tapan — honest local advice on routes, stays, transport and what to avoid.",
  path: "/consultation",
});

const whatsappMessage = `Hi Tapan, I have a question about the $10 India travel consultation.`;
const emailSubject = "$10 India travel consultation";
const emailBody = `Hi Tapan,\n\nI have a question about the $10 India travel consultation.\n\n`;

const includes = [
  "Honest destination advice",
  "Route & transport guidance",
  "Local knowledge",
  "Answers to your specific questions",
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
        <div className="mx-auto max-w-2xl">
          <SectionEyebrow>The $10 consultation</SectionEyebrow>
          <h1 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-charcoal sm:text-5xl lg:text-[56px]">
            Talk to an India Expert.
          </h1>
          <p className="mt-4 text-lg text-muted">
            60 minutes. One-on-one. No package pressure.
          </p>

          <div className="prose-editorial mt-8">
            <p>Planning India can get confusing.</p>
            <p>
              Tell me what you&apos;re planning and I&apos;ll help you make
              sense of it based on real local knowledge.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border border-brand-green/25 bg-brand-green-light/25 shadow-[0_18px_50px_rgba(29,158,117,0.10)]">
            <div className="p-7 sm:p-9 lg:p-10">
              <div className="flex items-baseline gap-3">
                <p className="font-serif text-6xl leading-none text-charcoal lg:text-7xl">
                  $10
                </p>
                <p className="text-sm text-charcoal-soft">USD</p>
              </div>
              <p className="mt-3 text-[15px] text-charcoal-soft">
                60-minute private consultation
              </p>

              <ul className="mt-8 space-y-2.5">
                {includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[15px] text-charcoal-soft"
                  >
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className="mt-1 shrink-0 text-brand-green"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <BookConsultationButton className="w-full sm:w-auto" />
                <p className="mt-4 text-[13px] leading-relaxed text-muted">
                  Pick a time · Pay $10 · Get your confirmation and Google Meet
                  link.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <p className="text-[13px] text-muted">Prefer to ask first?</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
              <a
                href={whatsappLink(whatsappMessage)}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-charcoal underline-offset-4 hover:text-brand-green hover:underline"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
              <span aria-hidden className="text-charcoal/25">
                ·
              </span>
              <a
                href={mailtoLink(emailSubject, emailBody)}
                className="inline-flex items-center gap-2 text-charcoal underline-offset-4 hover:text-brand-green hover:underline"
              >
                <Mail size={15} />
                {site.contact.email}
              </a>
            </div>
          </div>

          <p className="mt-16 text-[13px] text-muted">
            Looking for something more involved?{" "}
            <Link
              href="/services"
              className="text-brand-green underline-offset-4 hover:underline"
            >
              See all four services and pricing
            </Link>
            .
          </p>
        </div>
      </Container>
    </>
  );
}
