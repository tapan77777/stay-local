export type ServiceTier = {
  id: "consultation" | "plan" | "local-help" | "curated";
  eyebrow: string;
  name: string;
  tagline: string;
  price: string;
  priceUsd: number | string;
  priceNote?: string;
  duration: string;
  bestFor: string;
  includes: string[];
  notIncluded?: string[];
  ctaLabel: string;
  ctaHref: string;
  emphasized?: boolean;
};

export const services: ServiceTier[] = [
  {
    id: "consultation",
    eyebrow: "Start here",
    name: "Expert Consultation",
    tagline: "60 minutes, one-to-one, with Tapan.",
    price: "$10",
    priceUsd: 10,
    duration: "60-minute video call",
    bestFor:
      "Travelers who want honest, unbiased answers before committing to any plan.",
    includes: [
      "60-minute 1:1 video call with Tapan",
      "Ask anything about traveling in India",
      "Destination and route recommendations",
      "Honest local advice — what's worth it, what isn't",
      "Scam and tourist-trap awareness",
      "Follow-up notes over WhatsApp or email",
    ],
    ctaLabel: "Book Consultation — $10",
    ctaHref: "/consultation",
    emphasized: true,
  },
  {
    id: "plan",
    eyebrow: "Full plan",
    name: "Your India Plan",
    tagline: "A personalized India travel plan, built around you.",
    price: "$150",
    priceUsd: 150,
    duration: "Delivered within 5–7 days",
    bestFor:
      "Independent travelers who want a real, personal plan — not a generic tour brochure.",
    includes: [
      "Custom itinerary based on your travel style",
      "Destination selection tailored to you",
      "Recommended routes and pacing",
      "Trusted stays, food and experiences",
      "Local transport guidance",
      "Scam and safety awareness for your route",
      "Google Maps + useful links bundle",
      "WhatsApp support during your trip",
    ],
    ctaLabel: "Get Your India Plan — $150",
    ctaHref: "/consultation?service=plan",
  },
  {
    id: "local-help",
    eyebrow: "Plan + support",
    name: "Plan + Local Help",
    tagline: "Your India plan, plus a trusted local person on the ground.",
    price: "$150–$300",
    priceUsd: 150,
    priceNote: "Scales with trip length and complexity",
    duration: "Delivered within 5–7 days",
    bestFor:
      "First-time visitors who want the plan and a real human they can reach when things get confusing.",
    includes: [
      "Everything in Your India Plan",
      "Trusted local person available during your trip",
      "Local guidance and honest recommendations",
      "Help with navigation and directions",
      "Translation and communication help when needed",
      "Priority WhatsApp support",
    ],
    ctaLabel: "Get Plan + Local Help",
    ctaHref: "/consultation?service=local-help",
  },
  {
    id: "curated",
    eyebrow: "White-glove",
    name: "Fully Curated India Trip",
    tagline: "Your entire India trip — planned, booked, and handled.",
    price: "$1,000–$3,000+",
    priceUsd: "1000+",
    priceNote: "Depends on length, region and accommodation tier",
    duration: "Scoped and quoted after a discovery call",
    bestFor:
      "Travelers who want their India trip planned, booked and organized end-to-end.",
    includes: [
      "Complete itinerary and pacing",
      "Accommodation selected and booked",
      "Transport planned and booked",
      "Curated experiences and activities",
      "Vetted local guides where useful",
      "On-trip local support",
      "Priority WhatsApp during your trip",
    ],
    ctaLabel: "Enquire About Curated Trip",
    ctaHref: "/consultation?service=curated",
  },
];

export const principles = [
  {
    title: "No confusion.",
    body: "You will always know exactly what you're getting, what it costs, and what happens next.",
  },
  {
    title: "No hidden costs.",
    body: "Prices are the prices. Nothing added at checkout, no surprise fees on the ground.",
  },
  {
    title: "No time wasted.",
    body: "Advice is direct and personal. You don't sit through a sales pitch — you talk to Tapan.",
  },
];
