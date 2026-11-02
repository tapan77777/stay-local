import {
  PLACE_PRIORITIES,
  TRANSPORT_TYPES,
  PIN_CATEGORIES,
  NOTE_TYPES,
  GUIDE_CATEGORIES,
  MODULE_KEYS,
} from "../types";

export type Value = string | number | null;
export type RecordData = Record<string, Value>;
export type Snapshot = Record<string, RecordData[]>;
export interface Field {
  name: string;
  required?: boolean;
  type?: "integer" | "number" | "date" | "url";
  values?: readonly string[];
  min?: number;
  max?: number;
}
export interface Section {
  sheet: string;
  table: string;
  parent?: "plan_id" | "destination_id";
  fields: Field[];
}
const text = (names: string) => names.split(" ").map((name) => ({ name }));
const name: Field = { name: "name", required: true };
const title: Field = { name: "title", required: true };
const position: Field = {
  name: "position",
  required: true,
  type: "integer",
  min: 0,
  max: 10000,
};
const url = (name: string): Field => ({ name, type: "url" });
const date = (name: string): Field => ({ name, type: "date" });
export const VERSION = "staylocal-excel-1";
export const MAX_BYTES = 3 * 1024 * 1024;
export const MAX_ROWS = 2000;
export const SECTIONS: Section[] = [
  {
    sheet: "Plan Overview",
    table: "plans",
    fields: [
      title,
      ...text("subtitle traveler_name"),
      date("start_date"),
      date("end_date"),
      { name: "trip_days", type: "integer", min: 1, max: 1000 },
      ...text("travel_style budget_style special_preferences important_notes"),
      url("profile_photo_url"),
    ],
  },
  {
    sheet: "Destinations",
    table: "destinations",
    parent: "plan_id",
    fields: [
      position,
      name,
      ...text("intro tapan_intro"),
      date("arrival_date"),
      date("departure_date"),
      { name: "nights", type: "integer", min: 0, max: 1000 },
      url("hero_image_url"),
      ...MODULE_KEYS.map((key) => url(`${key}_image_url`)),
    ],
  },
  {
    sheet: "Itinerary",
    table: "itinerary_days",
    parent: "destination_id",
    fields: [
      position,
      ...text("day_label"),
      date("day_date"),
      ...text(
        "morning afternoon evening notes recommended_timing optional_items",
      ),
    ],
  },
  {
    sheet: "Places",
    table: "places",
    parent: "destination_id",
    fields: [
      position,
      name,
      ...text("description why_visit duration best_time"),
      { name: "priority", values: PLACE_PRIORITIES },
      url("map_url"),
      url("image_url"),
      ...text("tapan_note warning"),
    ],
  },
  {
    sheet: "Transport",
    table: "transports",
    parent: "destination_id",
    fields: [
      position,
      { name: "transport_type", values: TRANSPORT_TYPES },
      ...text(
        "from_location to_location duration instructions booking_info price_guidance tapan_note warning",
      ),
    ],
  },
  {
    sheet: "Stays",
    table: "stays",
    parent: "destination_id",
    fields: [
      position,
      name,
      ...text("area stay_type price_category why_recommended"),
      url("map_url"),
      url("booking_url"),
      url("image_url"),
      ...text("tapan_note"),
    ],
  },
  {
    sheet: "Food",
    table: "foods",
    parent: "destination_id",
    fields: [
      position,
      name,
      ...text("category what_to_try location why_recommended price_category"),
      url("map_url"),
      url("image_url"),
      ...text("tapan_note"),
    ],
  },
  {
    sheet: "Experiences",
    table: "experiences",
    parent: "destination_id",
    fields: [
      position,
      name,
      ...text("description why_recommended duration price location"),
      url("booking_url"),
      url("map_url"),
      url("image_url"),
      ...text("tapan_note"),
    ],
  },
  {
    sheet: "Maps",
    table: "map_pins",
    parent: "destination_id",
    fields: [
      position,
      name,
      { name: "latitude", type: "number", min: -90, max: 90 },
      { name: "longitude", type: "number", min: -180, max: 180 },
      { name: "category", values: PIN_CATEGORIES },
      ...text("description"),
      url("map_url"),
    ],
  },
  {
    sheet: "Notes",
    table: "destination_notes",
    parent: "destination_id",
    fields: [
      position,
      title,
      ...text("note"),
      { name: "note_type", values: NOTE_TYPES },
    ],
  },
  {
    sheet: "India Guide",
    table: "india_guide_items",
    parent: "plan_id",
    fields: [
      position,
      { name: "category", values: GUIDE_CATEGORIES },
      title,
      ...text("content"),
    ],
  },
  {
    sheet: "Documents",
    table: "plan_documents",
    parent: "plan_id",
    fields: [position, title, ...text("description"), url("file_url")],
  },
  {
    sheet: "Help",
    table: "plans",
    fields: text("whatsapp_contact support_info"),
  },
];
export const TABLES = SECTIONS.filter((s) => s.sheet !== "Help");
export function fieldsFor(table: string) {
  return SECTIONS.filter((s) => s.table === table).flatMap((s) => s.fields);
}
export function columns(section: Section) {
  return [
    "record_key",
    "action",
    ...(section.parent === "destination_id" ? ["destination_key"] : []),
    ...section.fields.map((f) => f.name),
  ];
}
export function emptySnapshot(): Snapshot {
  return Object.fromEntries(TABLES.map((s) => [s.table, []]));
}
export function defaultValue(field: Field): Value {
  if (field.values) {
    const preferred: Record<string, string> = {
      priority: "RECOMMENDED",
      transport_type: "OTHER",
      category: "PRACTICAL",
      note_type: "MY_TAKE",
    };
    return field.values.includes(preferred[field.name])
      ? preferred[field.name]
      : field.values[0];
  }
  return field.type === "integer" ||
    field.type === "number" ||
    field.type === "date"
    ? null
    : "";
}
