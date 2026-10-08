export const PLAN_STATUSES = [
  "DRAFT",
  "PREPARING",
  "READY",
  "ACTIVE",
  "COMPLETED",
  "DISABLED",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Draft",
  PREPARING: "Preparing",
  READY: "Ready",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  DISABLED: "Disabled",
};

export interface Customer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  privateToken: string;
  customerId: string;
  title: string;
  subtitle: string;
  startDate: string | null;
  endDate: string | null;
  status: PlanStatus;
  accessStartsAt: string | null;
  accessEndsAt: string | null;
  travelerName: string;
  tripDays: number | null;
  travelStyle: string;
  budgetStyle: string;
  specialPreferences: string;
  importantNotes: string;
  whatsappContact: string;
  supportInfo: string;
  maxDevices: number;
  createdAt: string;
  updatedAt: string;
}

export type PlanWithCustomer = Plan & { customer: Customer | null };

export type PlanAccessDenialReason =
  | "disabled"
  | "not_yet"
  | "expired"
  | "unknown";

export interface PlanAccessResult {
  ok: boolean;
  reason?: PlanAccessDenialReason;
}

// Per-plan device access control (schema-3-devices.sql).
// `maxDevices` is enforced server-side on both the unlock action and the
// subsequent `authenticatePlan` middleware so the limit cannot be bypassed
// by hitting a sub-route directly.
export const MIN_MAX_DEVICES = 1;
export const MAX_MAX_DEVICES = 20;

export interface PlanDevice {
  id: string;
  planId: string;
  deviceLabel: string | null;
  userAgent: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
}

// Shape returned by the atomic authorize-device operation. One of three
// cases so callers can render the right UI without a second query.
export type DeviceAuthResult =
  | { ok: true; status: "existing"; device: PlanDevice }
  | { ok: true; status: "registered"; device: PlanDevice }
  | { ok: false; status: "limit_reached"; activeCount: number; maxDevices: number };

// =========================================================================
// Phase 2A — destinations and modules
// =========================================================================

export interface Destination {
  id: string;
  planId: string;
  position: number;
  name: string;
  intro: string;
  arrivalDate: string | null;
  departureDate: string | null;
  nights: number | null;
  heroImageUrl: string;
  tapanIntro: string;
  // Per-module card artwork for the Journey page. Empty string = "no
  // override; fall back to heroImageUrl, then to the gradient placeholder".
  // Keyed on the same strings as `ModuleKey` so the renderer can look up
  // moduleImageUrls[key] directly.
  moduleImageUrls: Record<ModuleKey, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryDay {
  id: string;
  destinationId: string;
  position: number;
  dayLabel: string;
  dayDate: string | null;
  morning: string;
  afternoon: string;
  evening: string;
  notes: string;
  recommendedTiming: string;
  optionalItems: string;
  createdAt: string;
  updatedAt: string;
}

export const PLACE_PRIORITIES = [
  "MUST_SEE",
  "RECOMMENDED",
  "OPTIONAL",
] as const;
export type PlacePriority = (typeof PLACE_PRIORITIES)[number];

export const PLACE_PRIORITY_LABEL: Record<PlacePriority, string> = {
  MUST_SEE: "Must see",
  RECOMMENDED: "Recommended",
  OPTIONAL: "Optional",
};

export interface Place {
  id: string;
  destinationId: string;
  position: number;
  name: string;
  description: string;
  whyVisit: string;
  duration: string;
  bestTime: string;
  priority: PlacePriority;
  mapUrl: string;
  imageUrl: string;
  tapanNote: string;
  warning: string;
  createdAt: string;
  updatedAt: string;
}

export const TRANSPORT_TYPES = [
  "TRAIN",
  "FLIGHT",
  "TAXI",
  "BUS",
  "METRO",
  "WALKING",
  "OTHER",
] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

export const TRANSPORT_TYPE_LABEL: Record<TransportType, string> = {
  TRAIN: "Train",
  FLIGHT: "Flight",
  TAXI: "Taxi",
  BUS: "Bus",
  METRO: "Metro",
  WALKING: "Walking",
  OTHER: "Other",
};

export interface Transport {
  id: string;
  destinationId: string;
  position: number;
  transportType: TransportType;
  fromLocation: string;
  toLocation: string;
  duration: string;
  instructions: string;
  bookingInfo: string;
  priceGuidance: string;
  tapanNote: string;
  warning: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stay {
  id: string;
  destinationId: string;
  position: number;
  name: string;
  area: string;
  stayType: string;
  priceCategory: string;
  whyRecommended: string;
  mapUrl: string;
  bookingUrl: string;
  imageUrl: string;
  tapanNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Food {
  id: string;
  destinationId: string;
  position: number;
  name: string;
  category: string;
  whatToTry: string;
  location: string;
  whyRecommended: string;
  priceCategory: string;
  mapUrl: string;
  imageUrl: string;
  tapanNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: string;
  destinationId: string;
  position: number;
  name: string;
  description: string;
  whyRecommended: string;
  duration: string;
  price: string;
  location: string;
  bookingUrl: string;
  mapUrl: string;
  imageUrl: string;
  tapanNote: string;
  createdAt: string;
  updatedAt: string;
}

export const PIN_CATEGORIES = [
  "PLACE",
  "FOOD",
  "STAY",
  "EXPERIENCE",
  "TRANSPORT",
  "OTHER",
] as const;
export type PinCategory = (typeof PIN_CATEGORIES)[number];

export const PIN_CATEGORY_LABEL: Record<PinCategory, string> = {
  PLACE: "Place",
  FOOD: "Food",
  STAY: "Stay",
  EXPERIENCE: "Experience",
  TRANSPORT: "Transport",
  OTHER: "Other",
};

export interface MapPin {
  id: string;
  destinationId: string;
  position: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  category: PinCategory;
  description: string;
  mapUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_TYPES = [
  "MY_TAKE",
  "GOOD_TO_KNOW",
  "DONT_MISS",
  "ID_SKIP",
  "WATCH_OUT",
  "LOCAL_TIP",
] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  MY_TAKE: "My take",
  GOOD_TO_KNOW: "Good to know",
  DONT_MISS: "Don't miss",
  ID_SKIP: "I'd skip",
  WATCH_OUT: "Watch out",
  LOCAL_TIP: "Local tip",
};

export interface DestinationNote {
  id: string;
  destinationId: string;
  position: number;
  title: string;
  note: string;
  noteType: NoteType;
  createdAt: string;
  updatedAt: string;
}

export const GUIDE_CATEGORIES = [
  "MONEY",
  "SIM",
  "TRANSPORT",
  "CULTURE",
  "PRACTICAL",
  "SCAMS",
  "ARRIVAL",
  "PACKING",
  "EMERGENCY",
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export const GUIDE_CATEGORY_LABEL: Record<GuideCategory, string> = {
  MONEY: "Money",
  SIM: "SIM / eSIM",
  TRANSPORT: "Transport basics",
  CULTURE: "Cultural etiquette",
  PRACTICAL: "Practical advice",
  SCAMS: "Scams / tourist traps",
  ARRIVAL: "Arrival advice",
  PACKING: "Packing",
  EMERGENCY: "Emergency info",
};

export interface IndiaGuideItem {
  id: string;
  planId: string;
  position: number;
  category: GuideCategory;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDocument {
  id: string;
  planId: string;
  position: number;
  title: string;
  description: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const MODULE_KEYS = [
  "itinerary",
  "places",
  "transport",
  "stays",
  "food",
  "experiences",
  "map",
  "notes",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABEL: Record<ModuleKey, string> = {
  itinerary: "Itinerary",
  places: "Places",
  transport: "Transport",
  stays: "Stays",
  food: "Food",
  experiences: "Experiences",
  map: "Map",
  notes: "Tapan's Notes",
};

export interface DestinationModuleCounts {
  itinerary: number;
  places: number;
  transport: number;
  stays: number;
  food: number;
  experiences: number;
  map: number;
  notes: number;
}
