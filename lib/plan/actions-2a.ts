"use server";

/*
 * Phase 2A — server actions for the admin plan builder.
 *
 * All actions require admin. CRUD + reorder for destinations and every
 * destination module, plus plan-level India Guide, Documents, Help, and
 * Overview edits. Every action revalidates the specific plan builder path.
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./auth";
import {
  createDestination,
  deleteDestination,
  updateDestination,
} from "./destinations";
import {
  createItineraryDay,
  deleteItineraryDay,
  getItineraryDay,
  updateItineraryDay,
} from "./itinerary";
import { createPlace, deletePlace, getPlace, updatePlace } from "./places";
import {
  createTransport,
  deleteTransport,
  getTransport,
  updateTransport,
} from "./transports";
import { createStay, deleteStay, getStay, updateStay } from "./stays";
import { createFood, deleteFood, getFood, updateFood } from "./foods";
import {
  createExperience,
  deleteExperience,
  getExperience,
  updateExperience,
} from "./experiences";
import {
  createMapPin,
  deleteMapPin,
  getMapPin,
  updateMapPin,
} from "./map-pins";
import {
  createDestinationNote,
  deleteDestinationNote,
  getDestinationNote,
  updateDestinationNote,
} from "./notes";
import {
  createIndiaGuideItem,
  deleteIndiaGuideItem,
  getIndiaGuideItem,
  updateIndiaGuideItem,
} from "./india-guide";
import {
  createPlanDocument,
  deletePlanDocument,
  getPlanDocument,
  updatePlanDocument,
} from "./documents";
import { updatePlanHelp, updatePlanOverview } from "./plans";
import { swapPosition } from "./reorder";
import {
  GUIDE_CATEGORIES,
  MODULE_KEYS,
  NOTE_TYPES,
  PIN_CATEGORIES,
  PLACE_PRIORITIES,
  TRANSPORT_TYPES,
  type GuideCategory,
  type ModuleKey,
  type NoteType,
  type PinCategory,
  type PlacePriority,
  type TransportType,
} from "./types";

interface ActionError {
  error: string;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function rawStr(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function parseDate(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : v;
}

function parseInt32(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseFloat64(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseEnum<T extends readonly string[]>(
  values: T,
  input: string,
  fallback: T[number]
): T[number] {
  return (values as readonly string[]).includes(input)
    ? (input as T[number])
    : fallback;
}

// Field name convention: `moduleImageUrl_<key>` so one FormData per module
// without colliding with the hero `heroImageUrl` field. Keys are the same
// strings used by `ModuleKey`, so this helper is the single mapping place.
function parseModuleImageUrls(
  formData: FormData
): Record<ModuleKey, string> {
  const out = {} as Record<ModuleKey, string>;
  for (const key of MODULE_KEYS) {
    out[key] = str(formData, `moduleImageUrl_${key}`);
  }
  return out;
}

function revalidatePlan(planId: string) {
  revalidatePath(`/admin/plans/${planId}`);
}

function revalidateDestination(planId: string, destinationId: string) {
  revalidatePath(`/admin/plans/${planId}`);
  revalidatePath(`/admin/plans/${planId}/destinations/${destinationId}`);
}

// =========================================================================
// Plan overview + help
// =========================================================================

export async function updateOverviewAction(
  planId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const updated = await updatePlanOverview(planId, {
    travelerName: str(formData, "travelerName"),
    tripDays: parseInt32(formData, "tripDays"),
    travelStyle: str(formData, "travelStyle"),
    budgetStyle: str(formData, "budgetStyle"),
    specialPreferences: rawStr(formData, "specialPreferences"),
    importantNotes: rawStr(formData, "importantNotes"),
  });
  if (!updated) return { error: "Plan not found." };
  revalidatePlan(planId);
  return null;
}

export async function updateHelpAction(
  planId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const updated = await updatePlanHelp(planId, {
    whatsappContact: str(formData, "whatsappContact"),
    supportInfo: rawStr(formData, "supportInfo"),
  });
  if (!updated) return { error: "Plan not found." };
  revalidatePlan(planId);
  return null;
}

// =========================================================================
// Destinations
// =========================================================================

export async function createDestinationAction(
  planId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const name = str(formData, "name");
  if (!name) return { error: "Destination name is required." };
  const dest = await createDestination({
    planId,
    name,
    intro: rawStr(formData, "intro"),
    arrivalDate: parseDate(formData, "arrivalDate"),
    departureDate: parseDate(formData, "departureDate"),
    nights: parseInt32(formData, "nights"),
    heroImageUrl: str(formData, "heroImageUrl"),
    tapanIntro: rawStr(formData, "tapanIntro"),
    moduleImageUrls: parseModuleImageUrls(formData),
  });
  revalidatePlan(planId);
  redirect(`/admin/plans/${planId}/destinations/${dest.id}`);
}

export async function updateDestinationAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const name = str(formData, "name");
  if (!name) return { error: "Destination name is required." };
  const updated = await updateDestination(destinationId, {
    name,
    intro: rawStr(formData, "intro"),
    arrivalDate: parseDate(formData, "arrivalDate"),
    departureDate: parseDate(formData, "departureDate"),
    nights: parseInt32(formData, "nights"),
    heroImageUrl: str(formData, "heroImageUrl"),
    tapanIntro: rawStr(formData, "tapanIntro"),
    moduleImageUrls: parseModuleImageUrls(formData),
  });
  if (!updated) return { error: "Destination not found." };
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteDestinationAction(
  planId: string,
  destinationId: string
): Promise<void> {
  await requireAdmin();
  await deleteDestination(destinationId);
  revalidatePlan(planId);
  redirect(`/admin/plans/${planId}`);
}

export async function moveDestinationAction(
  planId: string,
  destinationId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("destinations", "plan_id", destinationId, direction);
  revalidatePlan(planId);
}

// =========================================================================
// Itinerary days
// =========================================================================

function itineraryInput(formData: FormData) {
  return {
    dayLabel: str(formData, "dayLabel"),
    dayDate: parseDate(formData, "dayDate"),
    morning: rawStr(formData, "morning"),
    afternoon: rawStr(formData, "afternoon"),
    evening: rawStr(formData, "evening"),
    notes: rawStr(formData, "notes"),
    recommendedTiming: rawStr(formData, "recommendedTiming"),
    optionalItems: rawStr(formData, "optionalItems"),
  };
}

export async function createItineraryDayAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  await createItineraryDay(destinationId, itineraryInput(formData));
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updateItineraryDayAction(
  planId: string,
  destinationId: string,
  dayId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const existing = await getItineraryDay(dayId);
  if (!existing) return { error: "Day not found." };
  await updateItineraryDay(dayId, itineraryInput(formData));
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteItineraryDayAction(
  planId: string,
  destinationId: string,
  dayId: string
): Promise<void> {
  await requireAdmin();
  await deleteItineraryDay(dayId);
  revalidateDestination(planId, destinationId);
}

export async function moveItineraryDayAction(
  planId: string,
  destinationId: string,
  dayId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("itinerary_days", "destination_id", dayId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// Places
// =========================================================================

function placeInput(formData: FormData) {
  return {
    name: str(formData, "name"),
    description: rawStr(formData, "description"),
    whyVisit: rawStr(formData, "whyVisit"),
    duration: str(formData, "duration"),
    bestTime: str(formData, "bestTime"),
    priority: parseEnum<typeof PLACE_PRIORITIES>(
      PLACE_PRIORITIES,
      str(formData, "priority"),
      "RECOMMENDED"
    ) as PlacePriority,
    mapUrl: str(formData, "mapUrl"),
    imageUrl: str(formData, "imageUrl"),
    tapanNote: rawStr(formData, "tapanNote"),
    warning: rawStr(formData, "warning"),
  };
}

export async function createPlaceAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = placeInput(formData);
  if (!input.name) return { error: "Place name is required." };
  await createPlace(destinationId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updatePlaceAction(
  planId: string,
  destinationId: string,
  placeId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = placeInput(formData);
  if (!input.name) return { error: "Place name is required." };
  const existing = await getPlace(placeId);
  if (!existing) return { error: "Place not found." };
  await updatePlace(placeId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deletePlaceAction(
  planId: string,
  destinationId: string,
  placeId: string
): Promise<void> {
  await requireAdmin();
  await deletePlace(placeId);
  revalidateDestination(planId, destinationId);
}

export async function movePlaceAction(
  planId: string,
  destinationId: string,
  placeId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("places", "destination_id", placeId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// Transport
// =========================================================================

function transportInput(formData: FormData) {
  return {
    transportType: parseEnum<typeof TRANSPORT_TYPES>(
      TRANSPORT_TYPES,
      str(formData, "transportType"),
      "OTHER"
    ) as TransportType,
    fromLocation: str(formData, "fromLocation"),
    toLocation: str(formData, "toLocation"),
    duration: str(formData, "duration"),
    instructions: rawStr(formData, "instructions"),
    bookingInfo: rawStr(formData, "bookingInfo"),
    priceGuidance: str(formData, "priceGuidance"),
    tapanNote: rawStr(formData, "tapanNote"),
    warning: rawStr(formData, "warning"),
  };
}

export async function createTransportAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  await createTransport(destinationId, transportInput(formData));
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updateTransportAction(
  planId: string,
  destinationId: string,
  transportId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const existing = await getTransport(transportId);
  if (!existing) return { error: "Transport not found." };
  await updateTransport(transportId, transportInput(formData));
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteTransportAction(
  planId: string,
  destinationId: string,
  transportId: string
): Promise<void> {
  await requireAdmin();
  await deleteTransport(transportId);
  revalidateDestination(planId, destinationId);
}

export async function moveTransportAction(
  planId: string,
  destinationId: string,
  transportId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("transports", "destination_id", transportId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// Stays
// =========================================================================

function stayInput(formData: FormData) {
  return {
    name: str(formData, "name"),
    area: str(formData, "area"),
    stayType: str(formData, "stayType"),
    priceCategory: str(formData, "priceCategory"),
    whyRecommended: rawStr(formData, "whyRecommended"),
    mapUrl: str(formData, "mapUrl"),
    bookingUrl: str(formData, "bookingUrl"),
    imageUrl: str(formData, "imageUrl"),
    tapanNote: rawStr(formData, "tapanNote"),
  };
}

export async function createStayAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = stayInput(formData);
  if (!input.name) return { error: "Stay name is required." };
  await createStay(destinationId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updateStayAction(
  planId: string,
  destinationId: string,
  stayId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = stayInput(formData);
  if (!input.name) return { error: "Stay name is required." };
  const existing = await getStay(stayId);
  if (!existing) return { error: "Stay not found." };
  await updateStay(stayId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteStayAction(
  planId: string,
  destinationId: string,
  stayId: string
): Promise<void> {
  await requireAdmin();
  await deleteStay(stayId);
  revalidateDestination(planId, destinationId);
}

export async function moveStayAction(
  planId: string,
  destinationId: string,
  stayId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("stays", "destination_id", stayId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// Food
// =========================================================================

function foodInput(formData: FormData) {
  return {
    name: str(formData, "name"),
    category: str(formData, "category"),
    whatToTry: rawStr(formData, "whatToTry"),
    location: str(formData, "location"),
    whyRecommended: rawStr(formData, "whyRecommended"),
    priceCategory: str(formData, "priceCategory"),
    mapUrl: str(formData, "mapUrl"),
    imageUrl: str(formData, "imageUrl"),
    tapanNote: rawStr(formData, "tapanNote"),
  };
}

export async function createFoodAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = foodInput(formData);
  if (!input.name) return { error: "Food name is required." };
  await createFood(destinationId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updateFoodAction(
  planId: string,
  destinationId: string,
  foodId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = foodInput(formData);
  if (!input.name) return { error: "Food name is required." };
  const existing = await getFood(foodId);
  if (!existing) return { error: "Food not found." };
  await updateFood(foodId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteFoodAction(
  planId: string,
  destinationId: string,
  foodId: string
): Promise<void> {
  await requireAdmin();
  await deleteFood(foodId);
  revalidateDestination(planId, destinationId);
}

export async function moveFoodAction(
  planId: string,
  destinationId: string,
  foodId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("foods", "destination_id", foodId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// Experiences
// =========================================================================

function experienceInput(formData: FormData) {
  return {
    name: str(formData, "name"),
    description: rawStr(formData, "description"),
    whyRecommended: rawStr(formData, "whyRecommended"),
    duration: str(formData, "duration"),
    price: str(formData, "price"),
    location: str(formData, "location"),
    bookingUrl: str(formData, "bookingUrl"),
    mapUrl: str(formData, "mapUrl"),
    imageUrl: str(formData, "imageUrl"),
    tapanNote: rawStr(formData, "tapanNote"),
  };
}

export async function createExperienceAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = experienceInput(formData);
  if (!input.name) return { error: "Experience name is required." };
  await createExperience(destinationId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updateExperienceAction(
  planId: string,
  destinationId: string,
  experienceId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = experienceInput(formData);
  if (!input.name) return { error: "Experience name is required." };
  const existing = await getExperience(experienceId);
  if (!existing) return { error: "Experience not found." };
  await updateExperience(experienceId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteExperienceAction(
  planId: string,
  destinationId: string,
  experienceId: string
): Promise<void> {
  await requireAdmin();
  await deleteExperience(experienceId);
  revalidateDestination(planId, destinationId);
}

export async function moveExperienceAction(
  planId: string,
  destinationId: string,
  experienceId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("experiences", "destination_id", experienceId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// Map pins
// =========================================================================

function mapPinInput(formData: FormData) {
  return {
    name: str(formData, "name"),
    latitude: parseFloat64(formData, "latitude"),
    longitude: parseFloat64(formData, "longitude"),
    category: parseEnum<typeof PIN_CATEGORIES>(
      PIN_CATEGORIES,
      str(formData, "category"),
      "PLACE"
    ) as PinCategory,
    description: rawStr(formData, "description"),
    mapUrl: str(formData, "mapUrl"),
  };
}

export async function createMapPinAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = mapPinInput(formData);
  if (!input.name) return { error: "Pin name is required." };
  await createMapPin(destinationId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updateMapPinAction(
  planId: string,
  destinationId: string,
  pinId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = mapPinInput(formData);
  if (!input.name) return { error: "Pin name is required." };
  const existing = await getMapPin(pinId);
  if (!existing) return { error: "Pin not found." };
  await updateMapPin(pinId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteMapPinAction(
  planId: string,
  destinationId: string,
  pinId: string
): Promise<void> {
  await requireAdmin();
  await deleteMapPin(pinId);
  revalidateDestination(planId, destinationId);
}

export async function moveMapPinAction(
  planId: string,
  destinationId: string,
  pinId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("map_pins", "destination_id", pinId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// Tapan's Notes (destination_notes)
// =========================================================================

function noteInput(formData: FormData) {
  return {
    title: str(formData, "title"),
    note: rawStr(formData, "note"),
    noteType: parseEnum<typeof NOTE_TYPES>(
      NOTE_TYPES,
      str(formData, "noteType"),
      "MY_TAKE"
    ) as NoteType,
  };
}

export async function createDestinationNoteAction(
  planId: string,
  destinationId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = noteInput(formData);
  if (!input.title) return { error: "Note title is required." };
  await createDestinationNote(destinationId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function updateDestinationNoteAction(
  planId: string,
  destinationId: string,
  noteId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = noteInput(formData);
  if (!input.title) return { error: "Note title is required." };
  const existing = await getDestinationNote(noteId);
  if (!existing) return { error: "Note not found." };
  await updateDestinationNote(noteId, input);
  revalidateDestination(planId, destinationId);
  return null;
}

export async function deleteDestinationNoteAction(
  planId: string,
  destinationId: string,
  noteId: string
): Promise<void> {
  await requireAdmin();
  await deleteDestinationNote(noteId);
  revalidateDestination(planId, destinationId);
}

export async function moveDestinationNoteAction(
  planId: string,
  destinationId: string,
  noteId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("destination_notes", "destination_id", noteId, direction);
  revalidateDestination(planId, destinationId);
}

// =========================================================================
// India Guide items (plan-level)
// =========================================================================

function guideInput(formData: FormData) {
  return {
    category: parseEnum<typeof GUIDE_CATEGORIES>(
      GUIDE_CATEGORIES,
      str(formData, "category"),
      "PRACTICAL"
    ) as GuideCategory,
    title: str(formData, "title"),
    content: rawStr(formData, "content"),
  };
}

export async function createIndiaGuideItemAction(
  planId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = guideInput(formData);
  if (!input.title) return { error: "Title is required." };
  await createIndiaGuideItem(planId, input);
  revalidatePlan(planId);
  return null;
}

export async function updateIndiaGuideItemAction(
  planId: string,
  itemId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = guideInput(formData);
  if (!input.title) return { error: "Title is required." };
  const existing = await getIndiaGuideItem(itemId);
  if (!existing) return { error: "Item not found." };
  await updateIndiaGuideItem(itemId, input);
  revalidatePlan(planId);
  return null;
}

export async function deleteIndiaGuideItemAction(
  planId: string,
  itemId: string
): Promise<void> {
  await requireAdmin();
  await deleteIndiaGuideItem(itemId);
  revalidatePlan(planId);
}

export async function moveIndiaGuideItemAction(
  planId: string,
  itemId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("india_guide_items", "plan_id", itemId, direction);
  revalidatePlan(planId);
}

// =========================================================================
// Documents (plan-level)
// =========================================================================

function documentInput(formData: FormData) {
  return {
    title: str(formData, "title"),
    description: rawStr(formData, "description"),
    fileUrl: str(formData, "fileUrl"),
  };
}

export async function createPlanDocumentAction(
  planId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = documentInput(formData);
  if (!input.title) return { error: "Title is required." };
  await createPlanDocument(planId, input);
  revalidatePlan(planId);
  return null;
}

export async function updatePlanDocumentAction(
  planId: string,
  documentId: string,
  _prev: ActionError | null,
  formData: FormData
): Promise<ActionError | null> {
  await requireAdmin();
  const input = documentInput(formData);
  if (!input.title) return { error: "Title is required." };
  const existing = await getPlanDocument(documentId);
  if (!existing) return { error: "Document not found." };
  await updatePlanDocument(documentId, input);
  revalidatePlan(planId);
  return null;
}

export async function deletePlanDocumentAction(
  planId: string,
  documentId: string
): Promise<void> {
  await requireAdmin();
  await deletePlanDocument(documentId);
  revalidatePlan(planId);
}

export async function movePlanDocumentAction(
  planId: string,
  documentId: string,
  direction: "up" | "down"
): Promise<void> {
  await requireAdmin();
  await swapPosition("plan_documents", "plan_id", documentId, direction);
  revalidatePlan(planId);
}

