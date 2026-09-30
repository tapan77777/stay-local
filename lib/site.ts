export const site = {
  name: "StayLocal",
  tagline: "Experience India Your Way.",
  description:
    "A personal India travel advisor for international travelers. Real first-hand advice — local knowledge, honest recommendations, and what to watch out for.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://staylocall.vercel.app",
  ogImage: "/og.jpg",
  founder: {
    name: "Tapan Naik",
    role: "Founder & India Travel Advisor",
    shortBio:
      "I have been traveling across India for years — the mountains, the coasts, the villages, the cities in between. StayLocal exists so travelers from outside India can experience the country the way locals actually live it.",
  },
  contact: {
    email: "tapannaik77777@gmail.com",
    whatsapp: "+919999999999",
  },
  // Social profile URLs. Instagram is null until a real StayLocal handle
  // exists — the footer renders it as a non-navigational "coming soon"
  // badge. Do not invent handles.
  social: {
    instagram: null as string | null,
    linkedin: "https://www.linkedin.com/in/tapan-naik/" as string | null,
  },
  locales: ["en-US", "en-GB", "en-AU"],
  currency: "USD",
} as const;

export const primaryCta = {
  label: "Talk to an India Expert — $10",
  href: "/consultation",
} as const;

export const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Experiences", href: "/experiences" },
  { label: "About", href: "/about" },
] as const;

export const footerLinks = {
  services: [
    { label: "Expert Consultation — $10", href: "/services#consultation" },
    { label: "Your India Plan — $150", href: "/services#plan" },
    {
      label: "Curated India + Personal Local Guide — $150–$300",
      href: "/services#local-help",
    },
    { label: "Fully Curated India — $1,000–$3,000+", href: "/services#curated" },
  ],
  explore: [
    { label: "Experiences", href: "/experiences" },
    { label: "About Tapan", href: "/about" },
    { label: "Pricing", href: "/pricing" },
  ],
} as const;

export function whatsappLink(message: string) {
  const clean = site.contact.whatsapp.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject: string, body: string) {
  return `mailto:${site.contact.email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
