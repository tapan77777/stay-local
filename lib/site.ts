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
    email: "hello@staylocal.travel",
    whatsapp: "+919999999999",
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
    { label: "Plan + Local Help — from $150", href: "/services#local-help" },
    { label: "Fully Curated Trip — from $1,000", href: "/services#curated" },
  ],
  explore: [
    { label: "Experiences", href: "/experiences" },
    { label: "About Tapan", href: "/about" },
    { label: "Pricing", href: "/pricing" },
  ],
  soon: [
    { label: "How it works", href: "/how-it-works" },
    { label: "Destinations", href: "/destinations" },
    { label: "Travel guides", href: "/travel-guides" },
    { label: "Reviews", href: "/reviews" },
    { label: "FAQ", href: "/faq" },
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
