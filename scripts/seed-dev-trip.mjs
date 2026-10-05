#!/usr/bin/env node
// StayLocal Plan — Phase 3F dev seed.
//
// Idempotent sample traveler for end-to-end QA of the $150 Your India Plan.
// Running this twice is safe: the prior Alex Morgan customer (+ cascading
// plan rows) is deleted first.
//
// Usage:
//   node scripts/seed-dev-trip.mjs
//
// Prints the private token + plan URL at the end.

import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function loadEnv() {
  if (process.env.DATABASE_URL) return;
  for (const name of [".env.local", ".env"]) {
    try {
      const raw = await fs.readFile(path.join(ROOT, name), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        if (process.env[key]) continue;
        let val = m[2];
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    } catch (err) {
      if (err && err.code !== "ENOENT") throw err;
    }
  }
}

function newPrivateToken() {
  return crypto.randomBytes(24).toString("base64url");
}

const CUSTOMER_EMAIL = "alex.morgan+dev@staylocal.local";
const WHATSAPP = "919876543210";

const PLAN_META = {
  title: "Alex’s 12-Day India Journey",
  subtitle: "Delhi · Agra · Jaipur · Varanasi",
  startDate: "2026-11-01",
  endDate: "2026-11-12",
  travelerName: "Alex",
  tripDays: 12,
  travelStyle: "Comfortable, culture-focused, slow mornings",
  budgetStyle: "Mid-range to premium",
  specialPreferences:
    "Vegetarian meals preferred. Prefers quiet neighbourhoods and heritage stays over big-brand hotels.",
  importantNotes:
    "International flights booked separately (BLR arrival on 1 Nov, DEL departure on 12 Nov). Carrying a 60L backpack only — no checked suitcase.",
  whatsappContact: WHATSAPP,
  supportInfo:
    "Message on WhatsApp any time between 8am–10pm IST. Reply within a few hours; if urgent, call directly.",
};

const DELHI = {
  name: "Delhi",
  position: 1,
  arrivalDate: "2026-11-01",
  departureDate: "2026-11-04",
  nights: 3,
  heroImageUrl:
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&q=80&auto=format&fit=crop",
  intro:
    "Delhi condenses a thousand years of empires into a single afternoon. Mughal domes, colonial boulevards and the cacophony of Chandni Chowk sit shoulder-to-shoulder. Three nights is enough to see the headlines and settle into the rhythm of the city.",
  tapanIntro:
    "Give Delhi one morning for Lodhi Garden before the heat sets in and one evening at Humayun's Tomb. If you only remember two moments from the city, let those be the two.",
  itinerary: [
    {
      dayLabel: "Day 1 — Arrival & Lodhi",
      dayDate: "2026-11-01",
      morning: "Arrive at IGI Terminal 3. Immigration can take 45–90 minutes on international arrivals.",
      afternoon:
        "Check in and rest. If you're up to it, a short walk around Khan Market for a lunch and a slow coffee.",
      evening:
        "Lodhi Garden (open till sunset) — the softest introduction to Delhi. Dinner at the hotel or Khan Chacha for kebab rolls.",
      notes: "Jet lag is real. Don't try to see monuments today.",
      recommendedTiming: "Lodhi: 4:30pm–6pm",
      optionalItems: "If energetic: Humayuns Tomb at twilight.",
    },
    {
      dayLabel: "Day 2 — Old Delhi",
      dayDate: "2026-11-02",
      morning:
        "Red Fort opens 9:30am. Allow 90 minutes. Combine with Jama Masjid across the road.",
      afternoon:
        "Lunch at Karim's (walking distance). Then a short rickshaw ride through Chandni Chowk's spice market.",
      evening:
        "Return to the hotel to clean up. Dinner at Indian Accent (reservations essential).",
      notes: "Old Delhi is dusty — wear a mask if pollution is high.",
      recommendedTiming: "Red Fort 10am; Karim's 1pm; Indian Accent 8pm.",
      optionalItems: "A guided food walk fits beautifully on this day if you'd like a local along.",
    },
    {
      dayLabel: "Day 3 — Mughal day",
      dayDate: "2026-11-03",
      morning:
        "Humayun's Tomb at opening (sunrise light, before the tour buses).",
      afternoon:
        "Qutub Minar in the afternoon. The complex is bigger than it looks — plan 90 minutes.",
      evening:
        "Early dinner, early sleep. Train to Agra tomorrow at 8am.",
      notes:
        "Pack an overnight bag only for Agra & Jaipur — leave your main luggage at the hotel if they'll hold it.",
      recommendedTiming: "Humayun's 6:30am; Qutub 2pm.",
      optionalItems: "Mehrauli Archaeological Park next to Qutub is worth 30 minutes if you're a history fan.",
    },
  ],
  places: [
    {
      name: "Humayun's Tomb",
      description:
        "The Mughal garden-tomb that inspired the Taj Mahal a century later. Red sandstone with white marble inlay, set in a formal char-bagh.",
      whyVisit:
        "A quiet, uncrowded Mughal masterpiece — the dress rehearsal for the Taj.",
      duration: "60–90 minutes",
      bestTime: "Opening (06:30) for soft light and no crowds",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Humayun%27s+Tomb+Delhi",
      imageUrl: "",
      tapanNote:
        "Enter through the Isa Khan tomb side-complex first — most visitors miss it and it's the prettier approach.",
      warning: "",
    },
    {
      name: "Qutub Minar",
      description:
        "A 73m tapering sandstone victory tower from the early 1200s. The complex around it has iron pillars and ruined mosque walls.",
      whyVisit:
        "Delhi's oldest surviving monument — pre-Mughal, pre-British.",
      duration: "60 minutes",
      bestTime: "Mid-afternoon when the stone glows",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Qutub+Minar+Delhi",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
    {
      name: "Red Fort",
      description:
        "The seat of Mughal power for 200 years. Enormous red walls, the Diwan-i-Khas and the Hayat Bakhsh garden.",
      whyVisit: "Scale, scale, scale. Nothing else in Delhi matches it.",
      duration: "90 minutes",
      bestTime: "Opening (09:30), weekday",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Red+Fort+Delhi",
      imageUrl: "",
      tapanNote:
        "Skip the sound-and-light show at night — it's dated and the audio is poor.",
      warning: "Closed Mondays.",
    },
    {
      name: "India Gate & Rajpath",
      description:
        "Lutyens' ceremonial boulevard, war memorial arch, and the enormous Kartavya Path lawns.",
      whyVisit:
        "The best place to see Delhi being Delhi — families, ice cream, kites.",
      duration: "45 minutes",
      bestTime: "After sunset (lit up)",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=India+Gate+Delhi",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
    {
      name: "Lodhi Garden",
      description:
        "A city park with 15th-century domed tombs scattered through 90 acres of lawns, bougainvillea and joggers.",
      whyVisit: "The gentlest, most civilised corner of Delhi.",
      duration: "60–90 minutes",
      bestTime: "Early morning or an hour before sunset",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=Lodhi+Garden+Delhi",
      imageUrl: "",
      tapanNote:
        "Walk toward the Bada Gumbad from the Lodhi Road gate — the light at sunset through the arches is the postcard shot.",
      warning: "",
    },
  ],
  foods: [
    {
      name: "Karim's",
      category: "Mughlai (meat-heavy)",
      whatToTry: "Mutton burra, nihari, sheermal",
      location: "Jama Masjid, Old Delhi",
      whyRecommended:
        "Running since 1913. The recipes haven't changed and that's the point.",
      priceCategory: "₹",
      mapUrl: "https://maps.google.com/?q=Karim%27s+Jama+Masjid",
      imageUrl: "",
      tapanNote:
        "Go for an early lunch (12pm). The dinner queue stretches down the lane.",
    },
    {
      name: "Khan Chacha",
      category: "Kebab rolls",
      whatToTry: "Mutton tikka roll, paneer roll",
      location: "Khan Market",
      whyRecommended:
        "Fast, filling, famously good. A reliable first dinner on an arrival day.",
      priceCategory: "₹",
      mapUrl: "https://maps.google.com/?q=Khan+Chacha+Khan+Market",
      imageUrl: "",
      tapanNote: "",
    },
    {
      name: "Indian Accent",
      category: "Modern Indian",
      whatToTry: "Blue cheese naan, pork ribs, chaat tasting",
      location: "The Lodhi hotel",
      whyRecommended:
        "The most interesting Indian tasting menu in Delhi. Chef Manish Mehrotra at the top of his game.",
      priceCategory: "₹₹₹",
      mapUrl: "https://maps.google.com/?q=Indian+Accent+Delhi",
      imageUrl: "",
      tapanNote:
        "Book two weeks ahead for weekend dinner. The tasting menu is worth the surcharge.",
    },
  ],
  stays: [
    {
      name: "The Lodhi",
      area: "Lodhi Road / Nizamuddin",
      stayType: "Luxury hotel",
      priceCategory: "₹₹₹₹",
      whyRecommended:
        "Big rooms with private plunge pools, quiet grounds, and walking distance to Lodhi Garden and Humayun's Tomb.",
      mapUrl: "https://maps.google.com/?q=The+Lodhi+Delhi",
      bookingUrl: "https://www.thelodhi.com/",
      imageUrl: "",
      tapanNote:
        "Request a room on the garden side — the airport-approach-side rooms face a flight path.",
    },
    {
      name: "Haveli Dharampura",
      area: "Chandni Chowk, Old Delhi",
      stayType: "Heritage boutique",
      priceCategory: "₹₹₹",
      whyRecommended:
        "A restored 1887 courtyard haveli in the heart of Old Delhi. 14 rooms, a rooftop restaurant with a Jama Masjid view.",
      mapUrl: "https://maps.google.com/?q=Haveli+Dharampura",
      bookingUrl: "https://havelidharampura.com/",
      imageUrl: "",
      tapanNote:
        "The lanes are narrow — your taxi will drop you a block away. Pack light.",
    },
  ],
  experiences: [
    {
      name: "Old Delhi Food & Heritage Walk",
      description:
        "A 3-hour walking tour through Chandni Chowk's spice market, paratha wali gali, and the Jama Masjid district with a local guide.",
      whyRecommended:
        "The best way to make sense of Old Delhi's density. You eat as you go.",
      duration: "3 hours",
      price: "~₹3,500 pp",
      location: "Starts at Chandni Chowk Metro",
      bookingUrl: "",
      mapUrl: "",
      imageUrl: "",
      tapanNote:
        "Go hungry. Don't plan a sit-down lunch after.",
    },
  ],
  transports: [
    {
      transportType: "METRO",
      fromLocation: "IGI Airport Terminal 3",
      toLocation: "New Delhi Railway Station",
      duration: "~20 minutes",
      instructions:
        "Follow 'Airport Express' signs from arrivals. Buy a ₹60 token at the counter.",
      bookingInfo: "No pre-booking. Operates 04:45–23:30 daily.",
      priceGuidance: "₹60 one-way",
      tapanNote:
        "Cleaner, faster and 10× cheaper than a pre-paid taxi. Baggage is fine.",
      warning: "",
    },
  ],
  mapPins: [
    { name: "Humayun's Tomb", lat: 28.5933, lng: 77.2507, category: "PLACE" },
    { name: "Qutub Minar", lat: 28.5245, lng: 77.1855, category: "PLACE" },
    { name: "Red Fort", lat: 28.6562, lng: 77.241, category: "PLACE" },
    { name: "India Gate", lat: 28.6129, lng: 77.2295, category: "PLACE" },
    { name: "Lodhi Garden", lat: 28.5918, lng: 77.2219, category: "PLACE" },
    { name: "Karim's", lat: 28.65, lng: 77.234, category: "FOOD" },
    { name: "Indian Accent", lat: 28.5952, lng: 77.2256, category: "FOOD" },
    { name: "The Lodhi", lat: 28.5952, lng: 77.2256, category: "STAY" },
  ],
  notes: [
    {
      title: "Pollution peaks in November",
      note: "Delhi's AQI often sits in the 200–350 range through November. Carry an N95 and avoid outdoor exercise after dark.",
      noteType: "WATCH_OUT",
    },
    {
      title: "Pay with UPI where you can",
      note: "Every monument, every street vendor, every rickshaw now takes UPI. If you have a UPI-linked wallet (Paytm, PhonePe for tourists) you'll barely need cash.",
      noteType: "LOCAL_TIP",
    },
  ],
};

const AGRA = {
  name: "Agra",
  position: 2,
  arrivalDate: "2026-11-04",
  departureDate: "2026-11-06",
  nights: 2,
  heroImageUrl:
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80&auto=format&fit=crop",
  intro:
    "Agra is one monument plus everything that supports it. Plan to see the Taj twice — once at sunrise with the river mist, and once from across the Yamuna at sunset.",
  tapanIntro:
    "Buy your Taj Mahal ticket online the night before. Entering through the East Gate at 6am is the single best decision you can make in India.",
  itinerary: [
    {
      dayLabel: "Day 4 — Arrival & Fort",
      dayDate: "2026-11-04",
      morning:
        "Gatimaan Express (08:10) from Nizamuddin. Arrives Agra 09:50. Check in and lunch.",
      afternoon: "Rest. Hydrate. The afternoon sun is still strong.",
      evening:
        "Agra Fort at 4pm — the stone turns red-gold in the last hour of light.",
      notes: "",
      recommendedTiming: "Fort entry 4pm, out before closing at 5:30pm.",
      optionalItems: "Mehtab Bagh at sunset instead if you prefer a Taj preview from across the river.",
    },
    {
      dayLabel: "Day 5 — Taj day",
      dayDate: "2026-11-05",
      morning:
        "East Gate opens 06:00. Be in line by 05:45. You'll have the Taj almost to yourself for 20 minutes.",
      afternoon: "Breakfast after. Rest through the heat of the day.",
      evening: "Mehtab Bagh at sunset for the river-side Taj view.",
      notes:
        "Camera batteries fully charged. Phones + small cameras OK; large tripods are not.",
      recommendedTiming: "Taj: 05:45 arrival, 09:00 exit. Mehtab Bagh: 5pm.",
      optionalItems: "",
    },
    {
      dayLabel: "Day 6 — Baby Taj & onward",
      dayDate: "2026-11-06",
      morning: "Itimad-ud-Daulah (the 'Baby Taj') on the river's east bank.",
      afternoon:
        "Private car to Jaipur via Fatehpur Sikri (optional stop, 90 min).",
      evening: "Arrive Jaipur. Easy dinner at the hotel.",
      notes: "The road is good — about 5 hours with the detour.",
      recommendedTiming: "Baby Taj 8am; depart Agra by 11am.",
      optionalItems: "Fatehpur Sikri is worth 90 minutes if you've not had enough Mughal architecture yet.",
    },
  ],
  places: [
    {
      name: "Taj Mahal",
      description:
        "The marble mausoleum Shah Jahan built for Mumtaz Mahal in the 1630s. Still, after four centuries, somehow bigger in person than you expect.",
      whyVisit: "The reason you are in Agra.",
      duration: "2–3 hours (plus entry queue)",
      bestTime: "Sunrise. Non-negotiable.",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Taj+Mahal",
      imageUrl: "",
      tapanNote:
        "East Gate has the shortest sunrise queue. South Gate is for people who want the long walk-up moment.",
      warning:
        "Closed every Friday for prayers. Plan around it.",
    },
    {
      name: "Agra Fort",
      description:
        "The Mughal fort-palace that housed the empire's capital before Delhi. Walls, apartments, mosques — and the pavilion where Shah Jahan was imprisoned with a view of the Taj.",
      whyVisit:
        "Underrated. If the Taj is the headline, this is the context.",
      duration: "90 minutes",
      bestTime: "Late afternoon (4pm) for golden light",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Agra+Fort",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
    {
      name: "Mehtab Bagh",
      description:
        "A Mughal garden on the opposite bank of the Yamuna, aligned exactly with the Taj. The sunset view from the river edge is unforgettable.",
      whyVisit:
        "The second-best view of the Taj. Quiet and almost tourist-free at sunset.",
      duration: "45 minutes",
      bestTime: "The hour before sunset",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=Mehtab+Bagh",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
    {
      name: "Itimad-ud-Daulah",
      description:
        "The 'Baby Taj' — smaller, earlier, and the first Mughal tomb to be built entirely in marble inlay. The experiment that became the Taj.",
      whyVisit:
        "Marble inlay at eye-level, with almost no crowds.",
      duration: "45 minutes",
      bestTime: "Morning (08:00–09:30)",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=Itimad-ud-Daulah",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
  ],
  foods: [
    {
      name: "Pinch of Spice",
      category: "North Indian / Mughlai",
      whatToTry: "Dal makhani, murg kali mirch, kulfi",
      location: "Fatehabad Road",
      whyRecommended:
        "Agra's most reliable mid-range restaurant. Consistent, clean, generous.",
      priceCategory: "₹₹",
      mapUrl: "https://maps.google.com/?q=Pinch+of+Spice+Agra",
      imageUrl: "",
      tapanNote: "",
    },
    {
      name: "Dasaprakash",
      category: "South Indian vegetarian",
      whatToTry: "Dosa thali, filter coffee, badam halwa",
      location: "Meher Theatre Complex",
      whyRecommended:
        "A clean, classic South Indian break after two days of rich Mughlai.",
      priceCategory: "₹",
      mapUrl: "https://maps.google.com/?q=Dasaprakash+Agra",
      imageUrl: "",
      tapanNote:
        "Open from 12:30pm — not an option for breakfast.",
    },
  ],
  stays: [
    {
      name: "The Oberoi Amarvilas",
      area: "Taj East Gate",
      stayType: "Luxury hotel",
      priceCategory: "₹₹₹₹",
      whyRecommended:
        "Every room has a Taj Mahal view. Walking distance to East Gate. Service is India's benchmark.",
      mapUrl: "https://maps.google.com/?q=Oberoi+Amarvilas",
      bookingUrl: "https://www.oberoihotels.com/hotels-in-agra-amarvilas-resort/",
      imageUrl: "",
      tapanNote:
        "Request a Premier Room with a terrace, not a balcony — more private.",
    },
  ],
  experiences: [
    {
      name: "Taj Mahal sunrise entry",
      description:
        "The first hour of light at the Taj Mahal, entering through East Gate at 06:00 opening.",
      whyRecommended:
        "The crowds are 10% of what they'll be by 09:00, and the light is incomparable.",
      duration: "2–3 hours",
      price: "₹1,300 foreigner / ₹200 Indian citizen",
      location: "East Gate ticket counter",
      bookingUrl: "https://asi.payumoney.com/",
      mapUrl: "",
      imageUrl: "",
      tapanNote:
        "Buy the ticket online the day before. The counter line in the dark adds 20 minutes you don't want to lose.",
    },
  ],
  transports: [
    {
      transportType: "TRAIN",
      fromLocation: "Hazrat Nizamuddin, Delhi",
      toLocation: "Agra Cantt",
      duration: "~1h 40m",
      instructions:
        "Gatimaan Express (12050). Departs 08:10. Executive Chair is worth the ₹300 premium — breakfast and a window.",
      bookingInfo: "Book 2–3 days ahead on IRCTC. Fills up on weekends.",
      priceGuidance: "₹775–₹1,500",
      tapanNote: "",
      warning: "",
    },
  ],
  mapPins: [
    { name: "Taj Mahal", lat: 27.1751, lng: 78.0421, category: "PLACE" },
    { name: "Agra Fort", lat: 27.1795, lng: 78.0211, category: "PLACE" },
    { name: "Mehtab Bagh", lat: 27.1812, lng: 78.0421, category: "PLACE" },
    { name: "Itimad-ud-Daulah", lat: 27.1931, lng: 78.0313, category: "PLACE" },
    { name: "Pinch of Spice", lat: 27.2033, lng: 78.0028, category: "FOOD" },
    { name: "Oberoi Amarvilas", lat: 27.167, lng: 78.051, category: "STAY" },
  ],
  notes: [
    {
      title: "Taj is closed on Fridays",
      note: "The whole Taj complex closes every Friday for prayers. If your Agra window includes a Friday, flip the itinerary so your sunrise visit falls on another day.",
      noteType: "WATCH_OUT",
    },
    {
      title: "Pre-book East Gate tickets",
      note: "The online queue at ASI's portal moves faster than the physical counter. Buy the night before and arrive at 05:45 for the 06:00 opening.",
      noteType: "LOCAL_TIP",
    },
  ],
};

const JAIPUR = {
  name: "Jaipur",
  position: 3,
  arrivalDate: "2026-11-06",
  departureDate: "2026-11-09",
  nights: 3,
  heroImageUrl:
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1600&q=80&auto=format&fit=crop",
  intro:
    "The Pink City is Rajasthan at its most photogenic. A royal grid of flamingo-pink sandstone, hill forts on every ridge, and bazaars that run until midnight.",
  tapanIntro:
    "Walk the City Palace quarter in the morning, retreat for lunch, then save Amer Fort for sunset — the stone turns gold in the last hour and the day-trippers are gone.",
  itinerary: [
    {
      dayLabel: "Day 6 — Arrive & settle",
      dayDate: "2026-11-06",
      morning: "On the road from Agra.",
      afternoon:
        "Arrive Jaipur mid-afternoon. Check in. A quick orientation walk around Johari Bazaar.",
      evening:
        "Dinner at LMB on MI Road — Rajasthani thali plus the sweet shop next door.",
      notes: "",
      recommendedTiming: "Johari Bazaar: 4–6pm. LMB: 7pm.",
      optionalItems: "",
    },
    {
      dayLabel: "Day 7 — City Palace & bazaars",
      dayDate: "2026-11-07",
      morning:
        "City Palace at opening (09:30). Combine with Jantar Mantar across the courtyard.",
      afternoon:
        "Hawa Mahal from across the street (the facade is the view). Lunch nearby.",
      evening: "Block printing workshop in Sanganer (pre-booked, 2 hours).",
      notes: "",
      recommendedTiming: "City Palace 09:30; Hawa Mahal 12pm; workshop 4pm.",
      optionalItems: "",
    },
    {
      dayLabel: "Day 8 — Amer at sunset",
      dayDate: "2026-11-08",
      morning:
        "Slow morning. Breakfast at the hotel. Pack an overnight bag for Varanasi.",
      afternoon:
        "Lunch at Suvarna Mahal (Rambagh Palace) — a royal dining room.",
      evening:
        "Amer Fort at 3:30pm. The afternoon light + emptier galleries is the correct combination.",
      notes:
        "Nahargarh Fort sunset drive-up after Amer closes — 10 minutes by car, best city skyline view.",
      recommendedTiming: "Amer 3:30pm; Nahargarh 5:30pm.",
      optionalItems: "",
    },
  ],
  places: [
    {
      name: "Amer Fort",
      description:
        "A hilltop fort-palace from the late 1500s. Marble, mirror-work, and courtyards stacked into a sandstone ridge above a lake.",
      whyVisit: "Rajasthan's single greatest building.",
      duration: "2 hours",
      bestTime: "3:30pm for soft light + lighter crowds",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Amer+Fort+Jaipur",
      imageUrl: "",
      tapanNote:
        "The Sheesh Mahal (Mirror Palace) is the showstopper. If a guard asks you to pose for 'a quick photo', politely decline — it's a tip trap.",
      warning: "",
    },
    {
      name: "Hawa Mahal",
      description:
        "The 1799 'Palace of Winds' — a five-storey pink sandstone screen with 953 small windows, built so royal women could watch the street unseen.",
      whyVisit:
        "The most photographed facade in India, and the easiest to tick off.",
      duration: "20 minutes (from the street)",
      bestTime: "08:30 for empty street + morning light",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Hawa+Mahal",
      imageUrl: "",
      tapanNote:
        "The best view is from the café balcony across the road, not from inside. Save your entry fee.",
      warning: "",
    },
    {
      name: "City Palace",
      description:
        "A still-inhabited royal palace at the heart of old Jaipur. Textile museum, armoury, and the Chandra Mahal (part of which the royal family still lives in).",
      whyVisit:
        "Rajput craftsmanship at its most ornate.",
      duration: "90 minutes",
      bestTime: "Opening (09:30)",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=City+Palace+Jaipur",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
    {
      name: "Jantar Mantar",
      description:
        "A UNESCO-listed open-air observatory from the 1730s. Nineteen huge stone astronomy instruments including the world's largest sundial.",
      whyVisit: "Nerdy, beautiful, and 10 minutes from the City Palace.",
      duration: "30–45 minutes",
      bestTime: "Mid-morning for crisp shadows",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=Jantar+Mantar+Jaipur",
      imageUrl: "",
      tapanNote:
        "Hire the ₹200 audio guide — the instruments are much more interesting with context.",
      warning: "",
    },
    {
      name: "Nahargarh Fort",
      description:
        "A hilltop fort above the city with a cafe and the single best panorama of Jaipur at sunset.",
      whyVisit: "The sunset view, nothing else.",
      duration: "60 minutes",
      bestTime: "Arrive 90 minutes before sunset",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=Nahargarh+Fort",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
  ],
  foods: [
    {
      name: "LMB (Laxmi Misthan Bhandar)",
      category: "Rajasthani vegetarian",
      whatToTry: "Rajasthani thali, ghewar, kulfi faluda",
      location: "Johari Bazaar",
      whyRecommended:
        "Running since 1954. The thali is the easiest way to try six Rajasthani dishes at once.",
      priceCategory: "₹₹",
      mapUrl: "https://maps.google.com/?q=LMB+Jaipur",
      imageUrl: "",
      tapanNote: "",
    },
    {
      name: "Suvarna Mahal, Rambagh Palace",
      category: "Royal / fine dining",
      whatToTry: "Laal maas, safed maas, royal thali",
      location: "Rambagh Palace hotel",
      whyRecommended:
        "A former royal dining room. The occasion is as much the point as the food.",
      priceCategory: "₹₹₹₹",
      mapUrl: "https://maps.google.com/?q=Suvarna+Mahal+Rambagh",
      imageUrl: "",
      tapanNote:
        "Lunch is a third the price of dinner and the room is just as grand.",
    },
    {
      name: "Rawat Mishthan Bhandar",
      category: "Sweets & snacks",
      whatToTry: "Pyaaz kachori, mawa kachori, mirchi vada",
      location: "Station Road",
      whyRecommended:
        "The famous pyaaz kachori. Walk-in, cash counter, 10-minute stop.",
      priceCategory: "₹",
      mapUrl: "https://maps.google.com/?q=Rawat+Mishthan+Bhandar",
      imageUrl: "",
      tapanNote: "",
    },
  ],
  stays: [
    {
      name: "Samode Haveli",
      area: "Gangapole, old Jaipur",
      stayType: "Heritage boutique",
      priceCategory: "₹₹₹",
      whyRecommended:
        "A 200-year-old haveli with painted ceilings, a peacock-filled courtyard, and only 39 rooms. Walking distance to the old city.",
      mapUrl: "https://maps.google.com/?q=Samode+Haveli",
      bookingUrl: "https://www.samode.com/samodehaveli/",
      imageUrl: "",
      tapanNote: "",
    },
  ],
  experiences: [
    {
      name: "Block printing workshop",
      description:
        "A 2-hour hands-on session with a Sanganer family printing studio. You block-print your own cotton scarf and take it home.",
      whyRecommended:
        "Memorable, slow, and the souvenir is something you actually made.",
      duration: "2 hours",
      price: "~₹2,500 pp",
      location: "Sanganer (20 min from the old city)",
      bookingUrl: "",
      mapUrl: "",
      imageUrl: "",
      tapanNote:
        "Wear something you don't mind getting indigo on.",
    },
    {
      name: "Amer Fort at sunrise",
      description:
        "An alternative to the sunset visit — Amer at opening (08:00), when the ramparts are empty.",
      whyRecommended:
        "The courtyards are yours alone for the first 45 minutes.",
      duration: "2 hours",
      price: "₹500 entry",
      location: "Amer Fort main gate",
      bookingUrl: "",
      mapUrl: "",
      imageUrl: "",
      tapanNote: "",
    },
  ],
  transports: [
    {
      transportType: "TAXI",
      fromLocation: "Agra",
      toLocation: "Jaipur (via Fatehpur Sikri)",
      duration: "~5 hours with the stop",
      instructions:
        "Pre-arranged private car. Driver will meet you at your Agra hotel at 11:00 and drop you at Samode Haveli.",
      bookingInfo:
        "Arranged through hotel concierge or Savaari / MakeMyTrip.",
      priceGuidance: "₹5,500–₹7,500 one way",
      tapanNote:
        "Tip the driver ₹500 if the car is clean and he kept to the plan. It makes a difference locally.",
      warning: "",
    },
  ],
  mapPins: [
    { name: "Amer Fort", lat: 26.9855, lng: 75.8513, category: "PLACE" },
    { name: "Hawa Mahal", lat: 26.9239, lng: 75.8267, category: "PLACE" },
    { name: "City Palace", lat: 26.9258, lng: 75.8237, category: "PLACE" },
    { name: "Jantar Mantar", lat: 26.9247, lng: 75.8244, category: "PLACE" },
    { name: "Nahargarh Fort", lat: 26.9397, lng: 75.8151, category: "PLACE" },
    { name: "LMB", lat: 26.9236, lng: 75.8277, category: "FOOD" },
    { name: "Samode Haveli", lat: 26.928, lng: 75.8292, category: "STAY" },
  ],
  notes: [
    {
      title: "Amer Fort elephant rides",
      note: "The elephant ride up to the fort is a well-documented animal-welfare issue. The 10-minute uphill jeep ride is faster, cheaper, and the ethical choice.",
      noteType: "ID_SKIP",
    },
    {
      title: "Johari for silver, Bapu for textiles",
      note: "Johari Bazaar is the one for jewellery (ask for the per-gram silver rate before the quote). Bapu Bazaar runs the length of the old city wall and is best for block-printed cottons.",
      noteType: "LOCAL_TIP",
    },
  ],
};

const VARANASI = {
  name: "Varanasi",
  position: 4,
  arrivalDate: "2026-11-09",
  departureDate: "2026-11-12",
  nights: 3,
  heroImageUrl:
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1600&q=80&auto=format&fit=crop",
  intro:
    "Varanasi is the oldest city on Earth that still functions as a city. The ghats hum from 4am to past midnight. It can overwhelm you — that's part of the trip.",
  tapanIntro:
    "Take the sunrise boat on your first morning. The slow pre-dawn river light does more for you than any monument ever can. Stay close to Assi Ghat — it's calmer than Dashashwamedh.",
  itinerary: [
    {
      dayLabel: "Day 9 — Arrival & aarti",
      dayDate: "2026-11-09",
      morning: "Fly Jaipur → Varanasi. Check in by 2pm.",
      afternoon: "Rest. Short wander around Assi Ghat.",
      evening:
        "Dashashwamedh Ghat evening aarti (18:30–19:30). Walk down from Assi via the ghat path — much calmer than taking a rickshaw through the lanes.",
      notes: "",
      recommendedTiming: "Walk to Dashashwamedh at 17:30.",
      optionalItems: "",
    },
    {
      dayLabel: "Day 10 — Sunrise + Sarnath",
      dayDate: "2026-11-10",
      morning:
        "05:30 wake-up. Sunrise Ganges boat from Assi Ghat (06:00 start, ~90 min).",
      afternoon: "Breakfast + 2 hours of nothing. Then taxi to Sarnath.",
      evening:
        "Dinner on Assi Ghat. Early sleep.",
      notes: "",
      recommendedTiming: "Boat 06:00; Sarnath 2pm.",
      optionalItems: "",
    },
    {
      dayLabel: "Day 11 — Lanes & lassi",
      dayDate: "2026-11-11",
      morning: "Blue Lassi Shop (opens 10am). Then the lanes behind Vishwanath Gali.",
      afternoon:
        "Kashi Vishwanath Temple corridor (allow 2 hours including the security queue).",
      evening: "Slow walk along the full stretch of ghats back to Assi.",
      notes: "",
      recommendedTiming: "Vishwanath 2pm (quieter than morning).",
      optionalItems: "",
    },
  ],
  places: [
    {
      name: "Dashashwamedh Ghat",
      description:
        "The main river-side ghat and the stage for the evening Ganga aarti — a 60-minute ceremony with seven priests, bells, oil lamps and incense.",
      whyVisit: "The city's single most public ritual.",
      duration: "60 minutes (ceremony)",
      bestTime: "18:30 (ceremony starts promptly)",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Dashashwamedh+Ghat",
      imageUrl: "",
      tapanNote:
        "Watch from a small shared boat on the river instead of the ghat steps — the view is better and it's ₹200.",
      warning: "",
    },
    {
      name: "Assi Ghat",
      description:
        "The southernmost of the main ghats and the quietest. Yoga classes, chai stalls, and the Subah-e-Banaras morning ceremony.",
      whyVisit:
        "The sunrise end of Varanasi. Where to stay close to.",
      duration: "60 minutes (morning)",
      bestTime: "05:30 for Subah-e-Banaras",
      priority: "MUST_SEE",
      mapUrl: "https://maps.google.com/?q=Assi+Ghat",
      imageUrl: "",
      tapanNote: "",
      warning: "",
    },
    {
      name: "Sarnath",
      description:
        "The site where the Buddha gave his first sermon, 10km north of the city. The Dhamek Stupa, the archaeological museum (home of the Lion Capital).",
      whyVisit:
        "A quiet, green half-day away from Varanasi's intensity.",
      duration: "3 hours including travel",
      bestTime: "Early afternoon",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=Sarnath",
      imageUrl: "",
      tapanNote:
        "The museum closes earlier than the stupa site — do it first.",
      warning: "",
    },
    {
      name: "Kashi Vishwanath Temple",
      description:
        "One of Hinduism's twelve Jyotirlinga shrines, in a new corridor-ised complex connecting it to the Ganges.",
      whyVisit:
        "The spiritual centre of Varanasi.",
      duration: "60–90 minutes (incl. security)",
      bestTime: "Afternoon (quieter than morning)",
      priority: "RECOMMENDED",
      mapUrl: "https://maps.google.com/?q=Kashi+Vishwanath",
      imageUrl: "",
      tapanNote:
        "No phones, no bags, no leather. There are lockers at the entry — use them.",
      warning:
        "Security is thorough. Expect a 30-minute queue.",
    },
  ],
  foods: [
    {
      name: "Blue Lassi Shop",
      category: "Lassi",
      whatToTry: "Pomegranate lassi, saffron lassi, apple lassi",
      location: "Kachori Gali, near Vishwanath",
      whyRecommended:
        "Running since 1925. Each lassi served in a kulhad clay cup. Try two.",
      priceCategory: "₹",
      mapUrl: "https://maps.google.com/?q=Blue+Lassi+Shop+Varanasi",
      imageUrl: "",
      tapanNote:
        "Cash only. Opens at 10am sharp.",
    },
    {
      name: "Keshar Dalmoth",
      category: "Street snacks / sweets",
      whatToTry: "Dalmoth, kachori sabzi, launglata",
      location: "Thatheri Bazaar",
      whyRecommended:
        "An institution. The dalmoth here is the one every Varanasi local sends out as gifts.",
      priceCategory: "₹",
      mapUrl: "https://maps.google.com/?q=Keshar+Dalmoth",
      imageUrl: "",
      tapanNote: "",
    },
    {
      name: "Baati Chokha",
      category: "Bihari / rustic",
      whatToTry: "Baati chokha thali, litti",
      location: "Teliyabagh",
      whyRecommended:
        "Sit on floor cushions, eat clay-oven baatis with mashed brinjal and ghee. Deeply regional, deeply satisfying.",
      priceCategory: "₹₹",
      mapUrl: "https://maps.google.com/?q=Baati+Chokha+Varanasi",
      imageUrl: "",
      tapanNote: "",
    },
  ],
  stays: [
    {
      name: "BrijRama Palace",
      area: "Darbhanga Ghat",
      stayType: "Heritage palace",
      priceCategory: "₹₹₹₹",
      whyRecommended:
        "A restored 18th-century palace with 32 rooms, right on the ghat. River-facing suites, no road access (you arrive by boat).",
      mapUrl: "https://maps.google.com/?q=BrijRama+Palace+Varanasi",
      bookingUrl: "https://brijramapalace.com/",
      imageUrl: "",
      tapanNote:
        "Request a river-view room, not a courtyard one — the whole point is the Ganges.",
    },
  ],
  experiences: [
    {
      name: "Sunrise Ganges boat",
      description:
        "A small shared rowboat along the ghats as the city wakes up. 06:00 start, 90 minutes, back by 07:30 for breakfast.",
      whyRecommended:
        "The quietest, most beautiful hour of Varanasi.",
      duration: "90 minutes",
      price: "₹500–₹1,000 pp (shared)",
      location: "Assi Ghat or hotel ghat",
      bookingUrl: "",
      mapUrl: "",
      imageUrl: "",
      tapanNote:
        "Insist on a rowboat, not a motorboat. The motor noise undoes the whole point.",
    },
  ],
  transports: [
    {
      transportType: "FLIGHT",
      fromLocation: "Jaipur (JAI)",
      toLocation: "Varanasi (VNS)",
      duration: "~1h 40m direct",
      instructions:
        "IndiGo and Air India both run direct flights. VNS airport is a 45-min taxi to the ghats.",
      bookingInfo: "Book 2–3 weeks ahead on the airline sites.",
      priceGuidance: "₹4,500–₹8,000",
      tapanNote: "",
      warning: "",
    },
  ],
  mapPins: [
    { name: "Dashashwamedh Ghat", lat: 25.3064, lng: 83.0109, category: "PLACE" },
    { name: "Assi Ghat", lat: 25.2888, lng: 83.0074, category: "PLACE" },
    { name: "Sarnath", lat: 25.3786, lng: 83.0231, category: "PLACE" },
    { name: "Kashi Vishwanath Temple", lat: 25.3109, lng: 83.0105, category: "PLACE" },
    { name: "Blue Lassi Shop", lat: 25.3103, lng: 83.0113, category: "FOOD" },
    { name: "BrijRama Palace", lat: 25.3144, lng: 83.0151, category: "STAY" },
  ],
  notes: [
    {
      title: "Photography at cremation ghats",
      note: "Manikarnika and Harishchandra Ghats are active cremation sites. No photos — not of the pyres, not of the mourners. If a 'guide' offers you a close-up view for a fee, decline and keep walking.",
      noteType: "WATCH_OUT",
    },
    {
      title: "Small cash + sturdy shoes",
      note: "The ghat-side lanes are slippery, uneven and full of cows. Wear closed shoes you can wash. Carry ₹500–₹1,000 in small notes for boat rides, lassi, and temple donations.",
      noteType: "GOOD_TO_KNOW",
    },
  ],
};

const INDIA_GUIDE_ITEMS = [
  {
    category: "ARRIVAL",
    title: "Delhi IGI Terminal 3",
    content:
      "All international flights land at T3. Immigration can take 45–90 minutes on busy mornings. Clear immigration → collect bags → walk to the pre-paid taxi counter OR take the Airport Metro Express (cleaner, cheaper, 20 minutes to New Delhi station). I'll track your flight on arrival day — WhatsApp me the moment you clear immigration.",
  },
  {
    category: "MONEY",
    title: "Cash + UPI",
    content:
      "Keep ₹5,000 cash on arrival for taxis and small purchases. ATMs are everywhere but have ₹10,000 per-withdrawal limits. For everything else, UPI is now universal — Paytm and PhonePe both run a tourist flow on an Indian SIM.",
  },
  {
    category: "SIM",
    title: "Local SIM card",
    content:
      "Buy an Airtel or Jio prepaid SIM at the Delhi airport (ground floor, after customs). You'll need your passport and a photo. 28-day tourist plan is ~₹1,500 and includes 25GB data. Activation can take 2–4 hours.",
  },
  {
    category: "TRANSPORT",
    title: "Trains, taxis, autos",
    content:
      "Intercity trains: book on IRCTC (I'll help you set up an account). In-city: Ola and Uber work in all four cities and are usually cheaper than hotel taxis. For old-city hops under 2km, use an auto-rickshaw — fix the price before you get in.",
  },
  {
    category: "PACKING",
    title: "What to actually pack",
    content:
      "November across North India is 10–25°C. One light sweater, one scarf, a wind-shell for Jaipur mornings. Closed shoes you can wash (ghat lanes). Modest tops for temples. Sunscreen, a small torch, a water bottle with a filter.",
  },
  {
    category: "CULTURE",
    title: "Temples, mosques, shoes",
    content:
      "Covered shoulders & knees for every religious site. Shoes come off before entry (there's always a shoe stand — small tip of ₹10). Phone photography is off inside sanctums. Leather items are not allowed in some temples — your belt will be asked for.",
  },
  {
    category: "SCAMS",
    title: "The common ones",
    content:
      "Taj East Gate 'official' photographer: skip. Rickshaw driver claims your hotel is 'closed' or 'moved' to steer you to a commission place: not true. Overpriced tuk-tuks: always confirm the fare before stepping in. If anything feels off, open Google Maps and refuse to be re-routed.",
  },
  {
    category: "EMERGENCY",
    title: "Numbers that work",
    content:
      "112 is India's universal emergency number (police / ambulance / fire). 100 police, 108 ambulance also still work. Message me on WhatsApp first for anything non-life-threatening — I'll help you find the right local contact faster than a call-centre line will.",
  },
];

const DOCUMENTS = [
  {
    title: "Full itinerary PDF",
    description:
      "A one-page printable summary of your 12-day plan. Also attached in your welcome email.",
    fileUrl: "",
  },
  {
    title: "Train tickets (Delhi → Agra)",
    description:
      "Gatimaan Express 12050. Executive Chair, coach EC1. PDF attached in your welcome email.",
    fileUrl: "",
  },
];

async function run() {
  await loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }
  const sql = neon(url);

  console.log(`\nSeeding Alex Morgan sample traveler…`);

  const existing = await sql`
    SELECT id FROM customers WHERE email = ${CUSTOMER_EMAIL}
  `;
  if (existing.length > 0) {
    const cid = existing[0].id;
    await sql`DELETE FROM plans WHERE customer_id = ${cid}`;
    await sql`DELETE FROM customers WHERE id = ${cid}`;
    console.log(`  removed prior customer ${cid}`);
  }

  const [customer] = await sql`
    INSERT INTO customers (name, email, whatsapp)
    VALUES ('Alex Morgan', ${CUSTOMER_EMAIL}, ${WHATSAPP})
    RETURNING id
  `;
  const customerId = customer.id;

  const token = newPrivateToken();
  const [plan] = await sql`
    INSERT INTO plans (
      customer_id, private_token,
      title, subtitle, start_date, end_date, status,
      traveler_name, trip_days, travel_style, budget_style,
      special_preferences, important_notes,
      whatsapp_contact, support_info
    ) VALUES (
      ${customerId}, ${token},
      ${PLAN_META.title}, ${PLAN_META.subtitle},
      ${PLAN_META.startDate}, ${PLAN_META.endDate}, 'READY',
      ${PLAN_META.travelerName}, ${PLAN_META.tripDays},
      ${PLAN_META.travelStyle}, ${PLAN_META.budgetStyle},
      ${PLAN_META.specialPreferences}, ${PLAN_META.importantNotes},
      ${PLAN_META.whatsappContact}, ${PLAN_META.supportInfo}
    ) RETURNING id
  `;
  const planId = plan.id;
  console.log(`  plan ${planId} created`);

  for (const dest of [DELHI, AGRA, JAIPUR, VARANASI]) {
    await seedDestination(sql, planId, dest);
  }

  for (let i = 0; i < INDIA_GUIDE_ITEMS.length; i++) {
    const item = INDIA_GUIDE_ITEMS[i];
    await sql`
      INSERT INTO india_guide_items (plan_id, position, category, title, content)
      VALUES (${planId}, ${i + 1}, ${item.category}::guide_category, ${item.title}, ${item.content})
    `;
  }
  console.log(`  ${INDIA_GUIDE_ITEMS.length} India Guide items`);

  for (let i = 0; i < DOCUMENTS.length; i++) {
    const doc = DOCUMENTS[i];
    await sql`
      INSERT INTO plan_documents (plan_id, position, title, description, file_url)
      VALUES (${planId}, ${i + 1}, ${doc.title}, ${doc.description}, ${doc.fileUrl})
    `;
  }
  console.log(`  ${DOCUMENTS.length} plan documents`);

  console.log(`\n✓ Seed complete.\n`);
  console.log(`  Traveler name: Alex Morgan`);
  console.log(`  Access code:   ${token}`);
  console.log(`  Local URL:     http://localhost:3000/plan/${token}`);
  console.log(``);
}

async function seedDestination(sql, planId, d) {
  const [row] = await sql`
    INSERT INTO destinations (
      plan_id, position, name, intro,
      arrival_date, departure_date, nights,
      hero_image_url, tapan_intro
    ) VALUES (
      ${planId}, ${d.position}, ${d.name}, ${d.intro},
      ${d.arrivalDate}, ${d.departureDate}, ${d.nights},
      ${d.heroImageUrl}, ${d.tapanIntro}
    ) RETURNING id
  `;
  const destId = row.id;
  console.log(`  ${d.name.padEnd(10)} dest ${destId}`);

  for (let i = 0; i < d.itinerary.length; i++) {
    const it = d.itinerary[i];
    await sql`
      INSERT INTO itinerary_days (
        destination_id, position, day_label, day_date,
        morning, afternoon, evening, notes,
        recommended_timing, optional_items
      ) VALUES (
        ${destId}, ${i + 1}, ${it.dayLabel}, ${it.dayDate},
        ${it.morning}, ${it.afternoon}, ${it.evening}, ${it.notes},
        ${it.recommendedTiming}, ${it.optionalItems}
      )
    `;
  }

  for (let i = 0; i < d.places.length; i++) {
    const p = d.places[i];
    await sql`
      INSERT INTO places (
        destination_id, position, name, description, why_visit,
        duration, best_time, priority,
        map_url, image_url, tapan_note, warning
      ) VALUES (
        ${destId}, ${i + 1}, ${p.name}, ${p.description}, ${p.whyVisit},
        ${p.duration}, ${p.bestTime}, ${p.priority}::place_priority,
        ${p.mapUrl}, ${p.imageUrl}, ${p.tapanNote}, ${p.warning}
      )
    `;
  }

  for (let i = 0; i < d.foods.length; i++) {
    const f = d.foods[i];
    await sql`
      INSERT INTO foods (
        destination_id, position, name, category, what_to_try,
        location, why_recommended, price_category,
        map_url, image_url, tapan_note
      ) VALUES (
        ${destId}, ${i + 1}, ${f.name}, ${f.category}, ${f.whatToTry},
        ${f.location}, ${f.whyRecommended}, ${f.priceCategory},
        ${f.mapUrl}, ${f.imageUrl}, ${f.tapanNote}
      )
    `;
  }

  for (let i = 0; i < d.stays.length; i++) {
    const s = d.stays[i];
    await sql`
      INSERT INTO stays (
        destination_id, position, name, area, stay_type, price_category,
        why_recommended, map_url, booking_url, image_url, tapan_note
      ) VALUES (
        ${destId}, ${i + 1}, ${s.name}, ${s.area}, ${s.stayType}, ${s.priceCategory},
        ${s.whyRecommended}, ${s.mapUrl}, ${s.bookingUrl}, ${s.imageUrl}, ${s.tapanNote}
      )
    `;
  }

  for (let i = 0; i < d.experiences.length; i++) {
    const e = d.experiences[i];
    await sql`
      INSERT INTO experiences (
        destination_id, position, name, description, why_recommended,
        duration, price, location, booking_url, map_url, image_url, tapan_note
      ) VALUES (
        ${destId}, ${i + 1}, ${e.name}, ${e.description}, ${e.whyRecommended},
        ${e.duration}, ${e.price}, ${e.location}, ${e.bookingUrl},
        ${e.mapUrl}, ${e.imageUrl}, ${e.tapanNote}
      )
    `;
  }

  for (let i = 0; i < d.transports.length; i++) {
    const t = d.transports[i];
    await sql`
      INSERT INTO transports (
        destination_id, position, transport_type, from_location, to_location,
        duration, instructions, booking_info, price_guidance,
        tapan_note, warning
      ) VALUES (
        ${destId}, ${i + 1}, ${t.transportType}::transport_type,
        ${t.fromLocation}, ${t.toLocation},
        ${t.duration}, ${t.instructions}, ${t.bookingInfo}, ${t.priceGuidance},
        ${t.tapanNote}, ${t.warning}
      )
    `;
  }

  for (let i = 0; i < d.mapPins.length; i++) {
    const m = d.mapPins[i];
    await sql`
      INSERT INTO map_pins (
        destination_id, position, name, latitude, longitude, category, description, map_url
      ) VALUES (
        ${destId}, ${i + 1}, ${m.name}, ${m.lat}, ${m.lng},
        ${m.category}::pin_category, '', ''
      )
    `;
  }

  for (let i = 0; i < d.notes.length; i++) {
    const n = d.notes[i];
    await sql`
      INSERT INTO destination_notes (
        destination_id, position, title, note, note_type
      ) VALUES (
        ${destId}, ${i + 1}, ${n.title}, ${n.note}, ${n.noteType}::note_type
      )
    `;
  }
}

run().catch((err) => {
  console.error("\nSeed failed:", err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
