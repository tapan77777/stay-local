// All copy and config for /guides. Keeping this centralized means the page
// files stay compact and the content is easy to audit in one place. No
// invented statistics, testimonials or guarantees.

// ----------------------------------------------------------------------
// Earning calculator — illustrative only. The number below is a *display*
// example, not a committed StayLocal rate. Change here (or wire to a real
// rate source later) without touching components.
// ----------------------------------------------------------------------

export const ILLUSTRATIVE_RATE_PER_GUEST_INR = 1000;
export const CALCULATOR_MIN_GUESTS = 1;
export const CALCULATOR_MAX_GUESTS = 20;
export const CALCULATOR_DEFAULT_GUESTS = 5;

// ----------------------------------------------------------------------
// Why guide with StayLocal — 6 benefits
// ----------------------------------------------------------------------

export const guideBenefits = [
  {
    n: "01",
    title: "Meet travelers from around the world",
    body: "Share your corner of India with people who flew across the globe to see it — curious travelers who actually want to listen.",
  },
  {
    n: "02",
    title: "Share the India you know",
    body: "The places, stories and small moments only locals carry. The India behind the brochure.",
  },
  {
    n: "03",
    title: "Choose assignments that fit your availability",
    body: "Say yes to the opportunities that fit your schedule. Pass on what doesn't. You stay in control.",
  },
  {
    n: "04",
    title: "Get paid for your time and local expertise",
    body: "Payment is agreed before each assignment, based on scope, destination, duration and the rate we settle on together.",
  },
  {
    n: "05",
    title: "Work with a travel brand that values trust",
    body: "StayLocal is built on honest advice and personal relationships — not volume, not pressure, not up-selling.",
  },
  {
    n: "06",
    title: "Build experience working with international travelers",
    body: "A chance to work with visitors from the USA, UK, Europe, Australia and beyond — and grow a profile that reflects it.",
  },
] as const;

// ----------------------------------------------------------------------
// What you get on an assignment
// ----------------------------------------------------------------------

export const guideWhatYouGet = [
  {
    title: "Guide payment, agreed up front",
    body: "Scope and rate are confirmed before each assignment — never in the middle of one.",
  },
  {
    title: "Travel allowance when applicable",
    body: "If an assignment requires travel outside your usual area, StayLocal may cover or arrange it. Specifics are confirmed before you accept.",
  },
  {
    title: "Stay when overnight travel is required",
    body: "When the assignment requires an overnight, StayLocal may cover or arrange accommodation. Confirmed per assignment.",
  },
  {
    title: "Meals when part of the scope",
    body: "If meals are part of the agreed scope, they're paid by StayLocal — not deducted from your payment.",
  },
  {
    title: "Clear assignment details",
    body: "Dates, destination, scope, duration and payment are shared in writing before you accept.",
  },
  {
    title: "StayLocal support during the assignment",
    body: "Someone from StayLocal is reachable while you're guiding — in case anything about the plan changes.",
  },
] as const;

export const guideWhatYouGetNote =
  "Depending on the assignment, StayLocal may cover or arrange travel, accommodation and meals required to complete the work. The exact inclusions are communicated before you accept the assignment — nothing is assumed.";

// ----------------------------------------------------------------------
// What you'll actually do
// ----------------------------------------------------------------------

export const guideWhatYouDo = [
  "Meet travelers at the agreed location",
  "Help them navigate the destination",
  "Explain local culture, history and places",
  "Share practical local knowledge",
  "Recommend appropriate food and experiences",
  "Help travelers communicate when language is a barrier",
  "Help them avoid common tourist confusion",
  "Keep the experience comfortable and organized",
  "Communicate with StayLocal when something changes",
] as const;

export const guideWhatYouDoNote =
  "A StayLocal Guide is responsible for the agreed scope of the assignment. Guides are not responsible for emergency, medical or security services — StayLocal and local services remain the correct contact for those.";

// ----------------------------------------------------------------------
// A day as a StayLocal Guide — editorial timeline
// ----------------------------------------------------------------------

export const guideDay = [
  {
    time: "08:30",
    title: "Meet the travelers",
    body: "At the agreed starting point — café, hotel lobby, trailhead.",
  },
  {
    time: "09:00",
    title: "Start the day's experience",
    body: "Set the pace. Share the first thing actually worth paying attention to.",
  },
  {
    time: "11:00",
    title: "Share the places and stories",
    body: "The context that turns a street into a story — the stuff a travel blog won't tell them.",
  },
  {
    time: "13:00",
    title: "Local food, local pace",
    body: "The right place to pause. Travelers tend to remember the meal as much as the view.",
  },
  {
    time: "15:00",
    title: "Continue exploring",
    body: "More ground, more context, more small discoveries only a local would plan.",
  },
  {
    time: "17:00",
    title: "Wrap up and say goodbye",
    body: "A clean finish. Practical next steps, a WhatsApp handover to StayLocal if useful.",
  },
] as const;

// ----------------------------------------------------------------------
// How assignments work (7-step with ~7-day notice)
// ----------------------------------------------------------------------

export const guideAssignmentProcess = [
  {
    n: "01",
    title: "A traveler books with StayLocal",
    body: "Every assignment starts with a real traveler planning a real trip.",
  },
  {
    n: "02",
    title: "We identify the right guide",
    body: "Based on destination, dates, scope, languages and relevant experience.",
  },
  {
    n: "03",
    title: "We contact you about the opportunity",
    body: "You get an outline of the assignment — scope, dates, destination, estimated duration.",
  },
  {
    n: "04",
    title: "Around 7 days' notice when possible",
    body: "We aim to give guides around 7 days' notice whenever we can. Some opportunities may come with shorter notice.",
  },
  {
    n: "05",
    title: "You confirm whether you're available",
    body: "Yes or no. Passing on an opportunity doesn't close the door on future ones.",
  },
  {
    n: "06",
    title: "You receive the complete assignment details",
    body: "Final scope, payment terms, who you're meeting and how to reach them.",
  },
  {
    n: "07",
    title: "You meet the travelers and guide them",
    body: "Deliver the agreed experience. StayLocal remains reachable throughout.",
  },
] as const;

// ----------------------------------------------------------------------
// From application to assignment — 6 steps
// ----------------------------------------------------------------------

export const guideApplicationSteps = [
  {
    n: "01",
    title: "Apply",
    body: "Tell us who you are, where you know and what kind of guiding you can offer.",
  },
  {
    n: "02",
    title: "Review",
    body: "We review your application and the information you've shared.",
  },
  {
    n: "03",
    title: "Interview",
    body: "If shortlisted, we'll contact you for a short conversation.",
  },
  {
    n: "04",
    title: "Join the network",
    body: "If selected, your profile becomes part of the StayLocal Guide Network.",
  },
  {
    n: "05",
    title: "Receive opportunities",
    body: "When a suitable traveler request comes in, we'll contact you.",
  },
  {
    n: "06",
    title: "Guide",
    body: "Accept the assignment, meet the travelers and deliver the agreed experience.",
  },
] as const;

// ----------------------------------------------------------------------
// Gallery — captions only. Images reuse existing travel-style assets as
// placeholders. When real guide photos exist, drop them into
// /public/images/guides/guide-01.jpg … and swap the src values below.
// ----------------------------------------------------------------------

export type GalleryItem = {
  src: string;
  caption: string;
};

export const guideGallery: GalleryItem[] = [
  {
    src: "/images/travel-styles/mountains.jpg",
    caption: "Your city. Your perspective.",
  },
  {
    src: "/images/travel-styles/local-life.jpg",
    caption: "Local knowledge makes the difference.",
  },
  {
    src: "/images/travel-styles/culture.jpg",
    caption: "History told by someone who grew up with it.",
  },
  {
    src: "/images/travel-styles/food.jpg",
    caption: "The places you'd never find on a search.",
  },
  {
    src: "/images/travel-styles/adventure.jpg",
    caption: "Trails that reward a local pace.",
  },
  {
    src: "/images/travel-styles/nature.jpg",
    caption: "The patience to find the right moment.",
  },
];

// ----------------------------------------------------------------------
// Trust — unchanged review areas
// ----------------------------------------------------------------------

export const guideTrustChecks = [
  {
    title: "Identity and details",
    body: "We review the information you share in your application against what travelers would reasonably want to know about the person they'll meet on the ground.",
  },
  {
    title: "Destination expertise",
    body: "We look at where you actually know, how long you've spent there, and whether your knowledge matches what travelers typically ask for.",
  },
  {
    title: "Communication",
    body: "A great guide can read the room and explain things clearly. We weigh how you communicate when we talk.",
  },
  {
    title: "Reliability",
    body: "Travelers are placing a day — or several — in your hands. Dependability is non-negotiable.",
  },
  {
    title: "Relevant experience",
    body: "Where it applies, we consider prior guiding, hosting or related travel work. Prior professional guiding is not a requirement.",
  },
] as const;

export const guideTrustNote =
  "StayLocal does not perform formal background checks or issue official certifications. The review process focuses on the areas listed above.";

// ----------------------------------------------------------------------
// FAQ — 8 questions, accordion
// ----------------------------------------------------------------------

export const guideFaqs = [
  {
    q: "Who can become a StayLocal Guide?",
    a: "Anyone with genuine local knowledge of a destination in India, strong communication skills and the ability to make visiting travelers feel at ease. You don't need to be a professional tour operator.",
  },
  {
    q: "Do I need professional guide experience?",
    a: "No. Prior guiding or hosting experience helps, but what matters more is real local knowledge, reliability and the ability to communicate clearly with international travelers.",
  },
  {
    q: "How are guide assignments offered?",
    a: "When StayLocal is working with a traveler whose plans fit your destination and style, we'll reach out to see if the assignment works for you. You decide whether to accept.",
  },
  {
    q: "How much can I earn?",
    a: "Earnings depend on the assignment — scope, destination, duration, group size and the rate we agree on. StayLocal does not guarantee a daily rate, booking volume or minimum income.",
  },
  {
    q: "Are travel, accommodation and food covered?",
    a: "Depending on the assignment, StayLocal may cover or arrange travel, accommodation and meals needed to complete the work. Specifics are confirmed in writing before you accept.",
  },
  {
    q: "How much notice will I receive?",
    a: "We aim to give guides around 7 days' notice whenever possible. Some opportunities may come with shorter notice, and you're free to decline anything that doesn't fit.",
  },
  {
    q: "What happens after I apply?",
    a: "We review your application and contact you if your profile fits the network. Shortlisted applicants are invited for a short conversation — not every applicant will be interviewed.",
  },
  {
    q: "Do I need to be available every day?",
    a: "No. You tell us the availability that works for you, and you can decline any assignment. StayLocal does not require full-time or fixed availability.",
  },
] as const;
