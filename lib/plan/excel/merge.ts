import { randomUUID } from "node:crypto";
import {
  SECTIONS,
  TABLES,
  fieldsFor,
  defaultValue,
  emptySnapshot,
  type Field,
  type RecordData,
  type Snapshot,
  type Value,
} from "./schema";
import type { ParsedWorkbook } from "./workbook";
export interface Change {
  key: string;
  sheet: string;
  kind: "add" | "modify" | "delete";
  before: RecordData | null;
  after: RecordData | null;
  fields: { field: string; before: Value; after: Value }[];
}
export interface MergeResult {
  snapshot: Snapshot;
  changes: Change[];
  errors: string[];
  warnings: string[];
}
const blank = (v: Value | undefined) => v == null || v === "";
export function validateValue(field: Field, value: Value): string | null {
  if (field.required && blank(value)) return "This field is required.";
  if (blank(value)) return null;
  if (
    typeof value === "string" &&
    (value.length >
      (field.name === "name" || field.name === "title" ? 200 : 10000) ||
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))
  )
    return "Text is too long or contains unsupported control characters.";
  if (field.values && !field.values.includes(String(value)))
    return `Choose one of: ${field.values.join(", ")}.`;
  if (field.type === "integer" || field.type === "number") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (field.type === "integer" && !Number.isInteger(value)) ||
      value < (field.min ?? -Infinity) ||
      value > (field.max ?? Infinity)
    )
      return `Enter a ${field.type === "integer" ? "whole" : "valid"} number between ${field.min} and ${field.max}.`;
  }
  if (
    field.type === "date" &&
    (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value)
  )
    return "Enter a real date as YYYY-MM-DD.";
  if (field.type === "url") {
    try {
      const u = new URL(String(value));
      if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
        return "Use an HTTP or HTTPS URL without credentials.";
    } catch {
      return "Use a complete HTTP or HTTPS URL.";
    }
  }
  return null;
}
export function validateSnapshot(snapshot: Snapshot): string[] {
  const errors: string[] = [];
  const destinations = new Map(snapshot.destinations.map((r) => [r.id, r]));
  const plan = snapshot.plans[0];
  if (!plan || snapshot.plans.length !== 1)
    errors.push("Plan Overview: exactly one plan is required.");
  for (const section of TABLES) {
    const ids = new Set<Value>(),
      positions = new Set<string>();
    for (const record of snapshot[section.table]) {
      const label = `${section.sheet} → ${record.name || record.title || record.day_label || record.id}`;
      if (ids.has(record.id)) errors.push(`${label}: duplicate record.`);
      ids.add(record.id);
      for (const field of fieldsFor(section.table)) {
        const error = validateValue(field, record[field.name] ?? null);
        if (error) errors.push(`${label} → ${field.name}: ${error}`);
      }
      if (
        section.parent === "destination_id" &&
        !destinations.has(record.destination_id)
      )
        errors.push(
          `${label} → destination_key: linked destination does not exist. Delete all children explicitly before deleting a destination.`,
        );
      if (section.parent) {
        const order = `${record[section.parent]}:${record.position}`;
        if (positions.has(order))
          errors.push(
            `${label} → position: duplicate ordering position within this section.`,
          );
        positions.add(order);
      }
      const pairs =
        section.table === "plans"
          ? [["start_date", "end_date"]]
          : section.table === "destinations"
            ? [["arrival_date", "departure_date"]]
            : [];
      for (const [start, end] of pairs)
        if (record[start] && record[end] && record[start]! > record[end]!)
          errors.push(`${label} → ${end}: must be on or after ${start}.`);
      if (section.table === "destinations" && plan) {
        if (
          plan.start_date &&
          record.arrival_date &&
          record.arrival_date < plan.start_date
        )
          errors.push(`${label} → arrival_date: before the plan start date.`);
        if (
          plan.end_date &&
          record.departure_date &&
          record.departure_date > plan.end_date
        )
          errors.push(`${label} → departure_date: after the plan end date.`);
      }
      if (section.table === "itinerary_days" && record.day_date) {
        const dest = destinations.get(record.destination_id);
        if (
          (dest?.arrival_date && record.day_date < dest.arrival_date) ||
          (dest?.departure_date && record.day_date > dest.departure_date) ||
          (plan?.start_date && record.day_date < plan.start_date) ||
          (plan?.end_date && record.day_date > plan.end_date)
        )
          errors.push(
            `${label} → day_date: outside destination or plan dates.`,
          );
      }
      if (
        section.table === "map_pins" &&
        blank(record.latitude) !== blank(record.longitude)
      )
        errors.push(
          `${label}: latitude and longitude must be supplied together.`,
        );
    }
  }
  return errors;
}
export function diffSnapshots(before: Snapshot, after: Snapshot): Change[] {
  const changes: Change[] = [];
  for (const section of TABLES) {
    const a = new Map(before[section.table].map((r) => [r.id, r])),
      b = new Map(after[section.table].map((r) => [r.id, r]));
    for (const id of new Set([...a.keys(), ...b.keys()])) {
      const old = a.get(id) ?? null,
        next = b.get(id) ?? null;
      const fields = [
        ...(section.parent ? [section.parent] : []),
        ...fieldsFor(section.table).map((f) => f.name),
      ]
        .filter((f) => (old?.[f] ?? null) !== (next?.[f] ?? null))
        .map((field) => ({
          field,
          before: old?.[field] ?? null,
          after: next?.[field] ?? null,
        }));
      if (!old || !next || fields.length)
        changes.push({
          key: `${section.table}:${id}`,
          sheet: section.sheet,
          kind: !old ? "add" : !next ? "delete" : "modify",
          before: old,
          after: next,
          fields,
        });
    }
  }
  return changes;
}
export function mergeWorkbook(
  parsed: ParsedWorkbook,
  before: Snapshot,
  planId: string,
): MergeResult {
  const snapshot = structuredClone(before),
    errors: string[] = [],
    warnings: string[] = [];
  const keys = new Map<string, string>();
  const existing = new Map(
    TABLES.map((s) => [
      s.table,
      new Map(before[s.table].map((r) => [`r_${r.id}`, String(r.id)])),
    ]),
  );
  const seen = new Set<string>();
  for (const entry of parsed.rows) {
    const section = SECTIONS.find((s) => s.sheet === entry.sheet)!;
    const key = String(entry.values.record_key ?? "");
    const location = `${entry.sheet} → Row ${entry.row} → record_key`;
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(key)) {
      errors.push(
        `${location}: use 1–80 letters, digits, underscores or hyphens.`,
      );
      continue;
    }
    if (seen.has(`${entry.sheet}:${key}`))
      errors.push(`${location}: duplicate stable identifier "${key}".`);
    seen.add(`${entry.sheet}:${key}`);
    const oldId = existing.get(section.table)?.get(key);
    if (key.startsWith("r_") && !oldId)
      errors.push(
        `${location}: exported identifier does not belong to this plan. Use a new key for new records.`,
      );
    const scope = `${section.table}:${key}`;
    if (!keys.has(scope))
      keys.set(
        scope,
        section.table === "plans" ? planId : (oldId ?? randomUUID()),
      );
  }
  // Existing destination keys can be referenced even when their rows are omitted.
  for (const [key, id] of existing.get("destinations")!)
    keys.set(`destinations:${key}`, id);
  let overviewCount = 0,
    helpCount = 0;
  for (const entry of parsed.rows) {
    const section = SECTIONS.find((s) => s.sheet === entry.sheet)!;
    const { values } = entry;
    const key = String(values.record_key ?? ""),
      id = keys.get(`${section.table}:${key}`);
    const prefix = `${entry.sheet} → Row ${entry.row}`;
    if (!id) continue;
    if (section.sheet === "Plan Overview" && ++overviewCount > 1)
      errors.push(`${prefix}: only one plan row is allowed.`);
    if (section.sheet === "Help" && ++helpCount > 1)
      errors.push(`${prefix}: only one help row is allowed.`);
    const action = values.action || "UPSERT";
    if (!["UPSERT", "DELETE"].includes(String(action))) {
      errors.push(`${prefix} → action: choose UPSERT, DELETE or EXAMPLE.`);
      continue;
    }
    const list = snapshot[section.table],
      oldIndex = list.findIndex((r) => r.id === id);
    if (action === "DELETE") {
      if (section.table === "plans")
        errors.push(`${prefix} → action: plans cannot be deleted from Excel.`);
      else if (oldIndex < 0)
        errors.push(
          `${prefix} → record_key: cannot delete a record that does not exist.`,
        );
      else list.splice(oldIndex, 1);
      continue;
    }
    const record: RecordData =
      oldIndex >= 0
        ? { ...list[oldIndex] }
        : {
            id,
            ...Object.fromEntries(
              fieldsFor(section.table).map((f) => [f.name, defaultValue(f)]),
            ),
          };
    if (section.parent === "plan_id") record.plan_id = planId;
    if (section.parent === "destination_id") {
      const destKey = String(values.destination_key ?? "");
      if (destKey) {
        const destinationId = keys.get(`destinations:${destKey}`);
        if (!destinationId)
          errors.push(
            `${prefix} → destination_key: Destination "${destKey}" does not exist.`,
          );
        else record.destination_id = destinationId;
      } else if (!record.destination_id)
        errors.push(`${prefix} → destination_key: a destination is required.`);
    }
    for (const field of section.fields) {
      let value = values[field.name];
      if (blank(value)) continue;
      if (value === "[CLEAR]") {
        if (field.required) {
          errors.push(
            `${prefix} → ${field.name}: required fields cannot be cleared.`,
          );
          continue;
        }
        value = defaultValue(field);
      }
      // Accept numeric Excel cells or unambiguous decimal text, never currency/grouping in numeric fields.
      if (
        (field.type === "number" || field.type === "integer") &&
        typeof value === "string" &&
        /^-?\d+(\.\d+)?$/.test(value)
      )
        value = Number(value);
      // Descriptive fields are TEXT in Postgres, even if Excel chose a numeric cell.
      if (!field.type && value != null) value = String(value);
      const error = validateValue(field, value!);
      if (error) errors.push(`${prefix} → ${field.name}: ${error}`);
      else record[field.name] = value!;
    }
    if (oldIndex >= 0) list[oldIndex] = record;
    else list.push(record);
    // Missing required inputs on NEW rows get precise cell coordinates.
    if (oldIndex < 0)
      for (const field of section.fields.filter((f) => f.required))
        if (blank(record[field.name]))
          errors.push(
            `${prefix} → ${field.name}: this field is required for a new record.`,
          );
  }
  if (!before.plans.length && overviewCount !== 1)
    errors.push("Plan Overview: fill exactly one UPSERT row to create a plan.");
  errors.push(...validateSnapshot(snapshot));
  if (!snapshot.destinations.length)
    warnings.push(
      "This plan has no destinations yet. You can add them in Plan Builder.",
    );
  return {
    snapshot,
    errors: [...new Set(errors)],
    warnings,
    changes: diffSnapshots(before, snapshot),
  };
}
export function selectChanges(
  before: Snapshot,
  changes: Change[],
  selected: string[],
): Snapshot {
  const accepted = new Set(selected),
    after = structuredClone(before);
  if (selected.some((key) => !changes.some((c) => c.key === key)))
    throw new Error("Unknown change selection.");
  for (const change of changes)
    if (accepted.has(change.key)) {
      const table = change.key.split(":")[0],
        id = (change.after ?? change.before)!.id;
      after[table] = after[table].filter((r) => r.id !== id);
      if (change.after) after[table].push(change.after);
    }
  const errors = validateSnapshot(after);
  if (errors.length) throw new Error(errors.slice(0, 8).join("\n"));
  return after;
}
export { emptySnapshot };
