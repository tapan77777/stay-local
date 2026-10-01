import { GuideHero } from "@/components/guides/guide-hero";
import { GuideEarningCalculator } from "@/components/guides/guide-earning-calculator";
import { GuideBenefits } from "@/components/guides/guide-benefits";
import { GuideWhatYouGet } from "@/components/guides/guide-what-you-get";
import { GuideWhatYouDo } from "@/components/guides/guide-what-you-do";
import { GuideDayTimeline } from "@/components/guides/guide-day-timeline";
import { GuideAssignmentProcess } from "@/components/guides/guide-assignment-process";
import { GuideHowItWorks } from "@/components/guides/guide-how-it-works";
import { GuideGallery } from "@/components/guides/guide-gallery";
import { GuideDestinations } from "@/components/guides/guide-destinations";
import { GuideTrust } from "@/components/guides/guide-trust";
import { GuideFaqAccordion } from "@/components/guides/guide-faq-accordion";
import { GuideFinalCta } from "@/components/guides/guide-final-cta";
import { JsonLd } from "@/components/site/jsonld";
import { buildMetadata, faqJsonLd } from "@/lib/seo";
import { guideFaqs } from "@/lib/guides";

export const metadata = buildMetadata({
  title: "Become a StayLocal Guide | Share the India You Know",
  description:
    "Join StayLocal's curated guide network and help international travelers experience India through genuine local knowledge.",
  path: "/guides",
});

export default function GuidesPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(guideFaqs.map((f) => ({ q: f.q, a: f.a })))} />
      <GuideHero />
      <GuideEarningCalculator />
      <GuideBenefits />
      <GuideWhatYouGet />
      <GuideWhatYouDo />
      <GuideDayTimeline />
      <GuideAssignmentProcess />
      <GuideHowItWorks />
      <GuideGallery />
      <GuideDestinations />
      <GuideTrust />
      <GuideFaqAccordion />
      <GuideFinalCta />
    </>
  );
}
