import type { Metadata } from "next";
import { site } from "./site";

type BuildMeta = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
};

export function buildMetadata({
  title,
  description = site.description,
  path = "/",
  image = site.ogImage,
  type = "website",
}: BuildMeta): Metadata {
  const fullTitle = title.includes(site.name) ? title : `${title} — ${site.name}`;
  const url = new URL(path, site.url).toString();
  const imageUrl = new URL(image, site.url).toString();
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: site.name,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: fullTitle }],
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}

export function orgJsonLd() {
  const sameAs = [site.social.instagram, site.social.linkedin].filter(
    (v): v is string => Boolean(v)
  );
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: site.name,
    url: site.url,
    description: site.description,
    areaServed: "IN",
    founder: {
      "@type": "Person",
      name: site.founder.name,
      jobTitle: site.founder.role,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: site.contact.email,
      contactType: "Customer Service",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs,
  };
}

export function experienceJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  place?: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    author: {
      "@type": "Person",
      name: site.founder.name,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: {
        "@type": "ImageObject",
        url: new URL("/icon.svg", site.url).toString(),
      },
    },
    image: input.image
      ? [input.image]
      : [new URL(site.ogImage, site.url).toString()],
    mainEntityOfPage: new URL(input.path, site.url).toString(),
    contentLocation: input.place ? { "@type": "Place", name: input.place } : undefined,
    datePublished: input.datePublished ?? "2026-01-01",
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a,
      },
    })),
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  priceUsd: number | string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    provider: { "@type": "Organization", name: site.name },
    areaServed: "IN",
    description: input.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: input.priceUsd,
      url: new URL(input.path, site.url).toString(),
    },
  };
}
