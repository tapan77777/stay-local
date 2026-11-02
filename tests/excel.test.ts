import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import ExcelJS from "exceljs";
import {
  makeWorkbook,
  parseWorkbook,
  type ParsedWorkbook,
} from "../lib/plan/excel/workbook";
import {
  emptySnapshot,
  mergeWorkbook,
  selectChanges,
  validateSnapshot,
} from "../lib/plan/excel/merge";
import { VERSION, SECTIONS } from "../lib/plan/excel/schema";
import {
  confirmPreview,
  readState,
  savePreview,
  listRevisions,
  restorePreview,
  type Database,
  type Preview,
} from "../lib/plan/excel/store";
import { handleExcelRequest } from "../lib/plan/excel/http";
const pg = new PGlite();
const db: Database = {
  async query(text, values = []) {
    return (await pg.query(text, values)).rows as Record<string, unknown>[];
  },
  async transaction(statements) {
    return pg.transaction(async (tx) => {
      for (const s of statements) await tx.query(s.text, s.values);
    });
  },
};
const customerId = randomUUID();
const parsed = (): ParsedWorkbook => ({
  metadata: { template_version: VERSION },
  rows: [
    {
      sheet: "Plan Overview",
      row: 2,
      values: {
        record_key: "plan",
        action: "UPSERT",
        title: "Andaman personalized escape",
        start_date: "2027-01-10",
        end_date: "2027-01-14",
        trip_days: 5,
      },
    },
    {
      sheet: "Destinations",
      row: 2,
      values: {
        record_key: "havelock",
        action: "UPSERT",
        position: 0,
        name: "Havelock",
        arrival_date: "2027-01-10",
        departure_date: "2027-01-14",
        nights: 4,
      },
    },
    {
      sheet: "Itinerary",
      row: 2,
      values: {
        record_key: "day-1",
        action: "UPSERT",
        destination_key: "havelock",
        position: 0,
        day_label: "Day 1",
        day_date: "2027-01-10",
        morning: "08:00 ferry to Havelock",
      },
    },
    {
      sheet: "Stays",
      row: 2,
      values: {
        record_key: "hotel",
        action: "UPSERT",
        destination_key: "havelock",
        position: 0,
        name: "Andaman stay",
        price_category: "INR 5,000 per night",
      },
    },
    {
      sheet: "Help",
      row: 2,
      values: {
        record_key: "plan",
        action: "UPSERT",
        support_info: "Contact StayLocal for assistance",
      },
    },
  ],
});
before(async () => {
  for (const file of [
    "schema.sql",
    "schema-2a.sql",
    "schema-3-devices.sql",
    "schema-4-module-images.sql",
    "schema-5-profile-photo.sql",
    "schema-6-excel.sql",
  ])
    await pg.exec(await readFile(`lib/plan/${file}`, "utf8"));
  await db.query("INSERT INTO customers(id,name,email) VALUES($1,$2,$3)", [
    customerId,
    "Isolated Test Customer",
    "test@example.invalid",
  ]);
});
after(async () => {
  await pg.close();
});
async function importPlan() {
  const id = randomUUID();
  const result = mergeWorkbook(parsed(), emptySnapshot(), id);
  assert.deepEqual(result.errors, []);
  const preview = await savePreview(db, {
    plan_id: id,
    customer_id: customerId,
    operation: "IMPORT",
    expected_version: null,
    before_snapshot: emptySnapshot(),
    after_snapshot: result.snapshot,
    changes: result.changes,
  });
  await confirmPreview(
    db,
    preview,
    result.changes.map((c) => c.key),
  );
  return { id, preview, result };
}
async function updatePreview(
  id: string,
  mutate: (state: Awaited<ReturnType<typeof readState>>) => void,
) {
  const state = await readState(db, id),
    after = structuredClone(state);
  mutate(after);
  const { diffSnapshots } = await import("../lib/plan/excel/merge");
  const changes = diffSnapshots(state.snapshot, after.snapshot);
  const preview = await savePreview(db, {
    plan_id: id,
    customer_id: null,
    operation: "UPDATE",
    expected_version: state.version,
    before_snapshot: state.snapshot,
    after_snapshot: after.snapshot,
    changes,
  });
  return { preview, changes, before: state };
}
test("template includes actual sheets, marked examples, required headers and dropdowns", async () => {
  const buffer = await makeWorkbook(undefined, {}, true),
    book = new ExcelJS.Workbook();
  await book.xlsx.load(buffer as never);
  await mkdir("outputs/excel", { recursive: true });
  await writeFile("outputs/excel/staylocal-template.xlsx", buffer);
  assert.deepEqual(
    book.worksheets.map((s) => s.name),
    ["Instructions", "Metadata", ...SECTIONS.map((s) => s.sheet)],
  );
  assert.equal(book.getWorksheet("Destinations")!.getCell("D1").value, "name*");
  assert.equal(
    book.getWorksheet("Places")!.getCell("B2").dataValidation.type,
    "list",
  );
  assert.equal((await parseWorkbook(buffer)).rows.length, 0);
});
test("valid workbook parses and imports atomically as DRAFT without private settings in export", async () => {
  const { id } = await importPlan();
  const state = await readState(db, id);
  const buffer = await makeWorkbook(state.snapshot, {
    export_scope: id,
    content_version: state.version,
  });
  const input = await parseWorkbook(buffer);
  assert.equal(input.metadata.export_scope, id);
  assert.equal(input.rows.length, 5);
  const [plan] = await db.query(
    "SELECT status,private_token FROM plans WHERE id=$1",
    [id],
  );
  assert.equal(plan.status, "DRAFT");
  assert.ok(plan.private_token);
  assert.ok(!JSON.stringify(input).includes(String(plan.private_token)));
});
test("required fields have sheet, row and column references", () => {
  const data = parsed();
  data.rows[1].values.name = "";
  assert.ok(
    mergeWorkbook(data, emptySnapshot(), randomUUID()).errors.some((e) =>
      e.includes("Destinations → Row 2 → name"),
    ),
  );
});
test("invalid destination references and duplicate stable keys reject the workbook", () => {
  const data = parsed();
  data.rows[2].values.destination_key = "missing";
  data.rows.push(data.rows[1]);
  const result = mergeWorkbook(data, emptySnapshot(), randomUUID());
  assert.ok(
    result.errors.some((e) =>
      e.includes('Destination "missing" does not exist'),
    ),
  );
  assert.ok(
    result.errors.some((e) => e.includes("duplicate stable identifier")),
  );
});
test("date ranges, impossible dates, enums, ordering, numeric types, unsafe URLs and text limits", () => {
  const data = parsed();
  Object.assign(data.rows[0].values, {
    start_date: "2027-02-30",
    trip_days: -1,
  });
  Object.assign(data.rows[1].values, {
    arrival_date: "2027-01-15",
    departure_date: "2027-01-12",
    hero_image_url: "javascript:alert(1)",
    intro: "x".repeat(10001),
  });
  data.rows.push({
    sheet: "Places",
    row: 8,
    values: {
      record_key: "beach",
      destination_key: "havelock",
      action: "UPSERT",
      name: "Beach",
      position: 0,
      priority: "BAD",
    },
  });
  const errors = mergeWorkbook(data, emptySnapshot(), randomUUID()).errors.join(
    "\n",
  );
  for (const term of [
    "real date",
    "trip_days",
    "on or after",
    "HTTP",
    "too long",
    "Choose one of",
  ])
    assert.ok(errors.includes(term), term);
});
test("wrong template version, malformed archives, formulas and external hyperlinks reject", async () => {
  await assert.rejects(
    parseWorkbook(Buffer.from("not a workbook")),
    /valid .xlsx/,
  );
  const buffer = await makeWorkbook(undefined, {}, true),
    book = new ExcelJS.Workbook();
  await book.xlsx.load(buffer as never);
  book.getWorksheet("Metadata")!.getCell("B2").value = "old";
  await assert.rejects(
    parseWorkbook(Buffer.from(await book.xlsx.writeBuffer())),
    /unsupported version/,
  );
  book.getWorksheet("Metadata")!.getCell("B2").value = VERSION;
  book.getWorksheet("Itinerary")!.getCell("G2").value = {
    formula: 'HYPERLINK("https://example.com")',
  };
  await assert.rejects(
    parseWorkbook(Buffer.from(await book.xlsx.writeBuffer())),
    /Formulas|formulas/,
  );
  book.getWorksheet("Itinerary")!.getCell("G2").value = {
    text: "click",
    hyperlink: "https://example.com",
  };
  await assert.rejects(
    parseWorkbook(Buffer.from(await book.xlsx.writeBuffer())),
    /external links/,
  );
});
test("unauthorized requests and cross-origin mutation are blocked before database access", async () => {
  const noDb: Database = {
    query: async () => {
      throw new Error("must not query");
    },
    transaction: async () => {
      throw new Error("must not mutate");
    },
  };
  assert.equal(
    (
      await handleExcelRequest(
        new Request("https://stay.local/admin/plans/excel?mode=preview", {
          method: "POST",
        }),
        noDb,
        async () => false,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handleExcelRequest(
        new Request("https://stay.local/admin/plans/excel?mode=confirm", {
          method: "POST",
          headers: { origin: "https://evil.invalid" },
        }),
        noDb,
        async () => true,
      )
    ).status,
    403,
  );
});
test("export/import round trip is unchanged; blank cells and omitted rows preserve content", async () => {
  const { id } = await importPlan(),
    state = await readState(db, id);
  const input = await parseWorkbook(
    await makeWorkbook(state.snapshot, {
      export_scope: id,
      content_version: state.version,
    }),
  );
  const roundtrip = mergeWorkbook(input, state.snapshot, id);
  assert.deepEqual(roundtrip.errors, []);
  assert.deepEqual(roundtrip.changes, []);
  input.rows = input.rows.filter((r) => r.sheet !== "Stays");
  input.rows.find((r) => r.sheet === "Itinerary")!.values.morning = "";
  assert.deepEqual(mergeWorkbook(input, state.snapshot, id).changes, []);
});
test("update matching records, add records and preserve protected settings", async () => {
  const { id } = await importPlan();
  await db.query("UPDATE plans SET status='ACTIVE',max_devices=3 WHERE id=$1", [
    id,
  ]);
  const update = await updatePreview(id, (state) => {
    state.snapshot.itinerary_days[0].morning = "09:30 ferry";
  });
  await confirmPreview(
    db,
    update.preview,
    update.changes.map((c) => c.key),
  );
  assert.equal(
    (await readState(db, id)).snapshot.itinerary_days[0].morning,
    "09:30 ferry",
  );
  assert.deepEqual(
    (
      await db.query("SELECT status,max_devices FROM plans WHERE id=$1", [id])
    )[0],
    { status: "ACTIVE", max_devices: 3 },
  );
});
test("explicit clearing and deletion, dependent parent deletion and selected-change validation", async () => {
  const { id } = await importPlan(),
    state = await readState(db, id);
  const input = await parseWorkbook(await makeWorkbook(state.snapshot));
  input.rows.find((r) => r.sheet === "Itinerary")!.values.morning = "[CLEAR]";
  input.rows.find((r) => r.sheet === "Stays")!.values.action = "DELETE";
  const result = mergeWorkbook(input, state.snapshot, id);
  assert.deepEqual(result.errors, []);
  assert.equal(result.snapshot.itinerary_days[0].morning, "");
  assert.equal(result.snapshot.stays.length, 0);
  const preview = await savePreview(db, {
    plan_id: id,
    customer_id: null,
    operation: "UPDATE",
    expected_version: state.version,
    before_snapshot: state.snapshot,
    after_snapshot: result.snapshot,
    changes: result.changes,
  });
  await confirmPreview(
    db,
    preview,
    result.changes.map((c) => c.key),
  );
  assert.equal((await readState(db, id)).snapshot.stays.length, 0);
  input.rows.find((r) => r.sheet === "Destinations")!.values.action = "DELETE";
  assert.ok(
    mergeWorkbook(input, state.snapshot, id).errors.some((e) =>
      e.includes("Delete all children explicitly"),
    ),
  );
});
test("transaction failure rolls back plan, rows, history and one-use receipt", async () => {
  const id = randomUUID(),
    result = mergeWorkbook(parsed(), emptySnapshot(), id);
  const preview = await savePreview(db, {
    plan_id: id,
    customer_id: customerId,
    operation: "IMPORT",
    expected_version: null,
    before_snapshot: emptySnapshot(),
    after_snapshot: result.snapshot,
    changes: result.changes,
  });
  const broken: Database = {
    query: db.query,
    transaction: (statements) =>
      db.transaction([...statements, { text: "SELECT 1/0", values: [] }]),
  };
  await assert.rejects(
    confirmPreview(
      broken,
      preview,
      result.changes.map((c) => c.key),
    ),
    /No changes were committed/,
  );
  assert.equal(
    (await db.query("SELECT id FROM plans WHERE id=$1", [id])).length,
    0,
  );
  assert.equal((await listRevisions(db, id)).length, 0);
  assert.equal(
    (
      await db.query(
        "SELECT completed_at FROM plan_excel_previews WHERE id=$1",
        [preview],
      )
    )[0].completed_at,
    null,
  );
  assert.equal(
    await confirmPreview(
      db,
      preview,
      result.changes.map((c) => c.key),
    ),
    id,
  );
});
test("repeated confirmation returns the same plan with no duplicate records/revisions", async () => {
  const { id, preview, result } = await importPlan();
  const count = (await listRevisions(db, id)).length;
  assert.equal(
    await confirmPreview(
      db,
      preview,
      result.changes.map((c) => c.key),
    ),
    id,
  );
  assert.equal((await listRevisions(db, id)).length, count);
  assert.equal((await readState(db, id)).snapshot.destinations.length, 1);
});
test("manual child edits invalidate pending previews and stale exports", async () => {
  const { id } = await importPlan(),
    update = await updatePreview(id, (state) => {
      state.snapshot.plans[0].title = "Changed";
    });
  const exported = await makeWorkbook(update.before.snapshot, {
    export_scope: id,
    content_version: update.before.version,
  });
  await db.query(
    "UPDATE itinerary_days SET morning=$1 WHERE destination_id=$2",
    ["Manual edit", update.before.snapshot.destinations[0].id],
  );
  await assert.rejects(
    confirmPreview(
      db,
      update.preview,
      update.changes.map((c) => c.key),
    ),
    /changed after export/,
  );
  const response = await handleExcelRequest(
    new Request(
      `https://stay.local/admin/plans/excel?mode=preview&plan=${id}`,
      {
        method: "POST",
        headers: { origin: "https://stay.local", "x-file-name": "edit.xlsx" },
        body: new Uint8Array(exported),
      },
    ),
    db,
    async () => true,
  );
  assert.equal(response.status, 409);
});
test("revision history and restoration preserve relationships and unrelated plans", async () => {
  const { id } = await importPlan(),
    other = await importPlan();
  const original = await readState(db, id),
    untouched = await readState(db, other.id);
  const update = await updatePreview(id, (state) => {
    state.snapshot.stays = [];
    state.snapshot.plans[0].title = "Updated";
  });
  await confirmPreview(
    db,
    update.preview,
    update.changes.map((c) => c.key),
  );
  const history = await listRevisions(db, id);
  assert.ok(history.some((r) => r.operation === "UPDATE"));
  const first = history.find((r) => r.operation === "IMPORT")!;
  const previewId = await restorePreview(db, id, String(first.id));
  const [preview] = await db.query(
    "SELECT * FROM plan_excel_previews WHERE id=$1",
    [previewId],
  );
  await confirmPreview(
    db,
    previewId,
    (preview.changes as Preview["changes"]).map((c) => c.key),
  );
  assert.deepEqual((await readState(db, id)).snapshot, original.snapshot);
  assert.deepEqual(await readState(db, other.id), untouched);
  await assert.rejects(
    restorePreview(db, other.id, String(first.id)),
    /Revision not found/,
  );
});
test("manipulated foreign record identifiers are rejected and selecting incomplete graphs fails", async () => {
  const one = await importPlan(),
    two = await importPlan();
  const foreign = await readState(db, two.id),
    state = await readState(db, one.id);
  const input = await parseWorkbook(await makeWorkbook(foreign.snapshot));
  assert.ok(
    mergeWorkbook(input, state.snapshot, one.id).errors.some((e) =>
      e.includes("does not belong"),
    ),
  );
  const result = mergeWorkbook(parsed(), emptySnapshot(), randomUUID());
  assert.throws(
    () =>
      selectChanges(
        emptySnapshot(),
        result.changes,
        result.changes
          .filter((c) => c.sheet !== "Destinations")
          .map((c) => c.key),
      ),
    /linked destination/,
  );
});
test("sample Andaman workbook generated from the actual import schema", async () => {
  const result = mergeWorkbook(parsed(), emptySnapshot(), randomUUID());
  assert.deepEqual(validateSnapshot(result.snapshot), []);
  // Convert server-generated IDs to human-friendly new-record keys in the sample template.
  const book = new ExcelJS.Workbook();
  await book.xlsx.load((await makeWorkbook(undefined, {}, true)) as never);
  for (const entry of parsed().rows) {
    const sheet = book.getWorksheet(entry.sheet)!;
    const headers = (sheet.getRow(1).values as string[])
      .slice(1)
      .map((h) => h.replace(/\*$/, ""));
    sheet.getRow(2).values = headers.map(
      (h) => entry.values[h as keyof typeof entry.values] ?? "",
    );
  }
  await mkdir("outputs/excel", { recursive: true });
  await writeFile(
    "outputs/excel/andaman-sample.xlsx",
    Buffer.from(await book.xlsx.writeBuffer()),
  );
});

test("HTTP upload preview, repeated upload deduplication, confirmation and completed replay", async () => {
  const buffer = await readFile("outputs/excel/andaman-sample.xlsx");
  const upload = () =>
    handleExcelRequest(
      new Request(
        `https://stay.local/admin/plans/excel?mode=preview&customer=${customerId}`,
        {
          method: "POST",
          headers: {
            origin: "https://stay.local",
            "x-file-name": "andaman.xlsx",
          },
          body: new Uint8Array(buffer),
        },
      ),
      db,
      async () => true,
    );
  const firstResponse = await upload();
  assert.equal(firstResponse.status, 200);
  const first = await firstResponse.json();
  const repeat = await (await upload()).json();
  assert.equal(repeat.preview, first.preview);
  assert.deepEqual(repeat.changes, first.changes);
  const response = await handleExcelRequest(
    new Request("https://stay.local/admin/plans/excel?mode=confirm", {
      method: "POST",
      headers: { origin: "https://stay.local" },
      body: JSON.stringify({
        preview: first.preview,
        selected: first.changes.map((c: { key: string }) => c.key),
      }),
    }),
    db,
    async () => true,
  );
  assert.equal(response.status, 200);
  assert.equal((await upload()).status, 409);
});
test("new records are added through Excel updates and individual changes can be rejected", async () => {
  const { id } = await importPlan(),
    state = await readState(db, id);
  const input = await parseWorkbook(await makeWorkbook(state.snapshot));
  input.rows.push({
    sheet: "Places",
    row: 2,
    values: {
      record_key: "radhanagar",
      action: "UPSERT",
      destination_key: `r_${state.snapshot.destinations[0].id}`,
      position: 0,
      name: "Radhanagar Beach",
      priority: "MUST_SEE",
    },
  });
  input.rows.find((r) => r.sheet === "Plan Overview")!.values.title =
    "Unwanted title";
  const result = mergeWorkbook(input, state.snapshot, id);
  assert.deepEqual(result.errors, []);
  const selected = result.changes
    .filter((c) => c.sheet === "Places")
    .map((c) => c.key);
  const preview = await savePreview(db, {
    plan_id: id,
    customer_id: null,
    operation: "UPDATE",
    expected_version: state.version,
    before_snapshot: state.snapshot,
    after_snapshot: result.snapshot,
    changes: result.changes,
  });
  await confirmPreview(db, preview, selected);
  const after = await readState(db, id);
  assert.equal(after.snapshot.places[0].name, "Radhanagar Beach");
  assert.equal(after.snapshot.plans[0].title, state.snapshot.plans[0].title);
});
test("explicit parent and child deletions apply together and can be restored", async () => {
  const { id } = await importPlan(),
    state = await readState(db, id);
  const input = await parseWorkbook(await makeWorkbook(state.snapshot));
  for (const row of input.rows)
    if (!["Plan Overview", "Help"].includes(row.sheet))
      row.values.action = "DELETE";
  const result = mergeWorkbook(input, state.snapshot, id);
  assert.deepEqual(result.errors, []);
  const preview = await savePreview(db, {
    plan_id: id,
    customer_id: null,
    operation: "UPDATE",
    expected_version: state.version,
    before_snapshot: state.snapshot,
    after_snapshot: result.snapshot,
    changes: result.changes,
  });
  await confirmPreview(
    db,
    preview,
    result.changes.map((c) => c.key),
  );
  assert.equal((await readState(db, id)).snapshot.destinations.length, 0);
  const baseline = (await listRevisions(db, id)).find(
    (r) => r.operation === "BASELINE",
  )!;
  const restore = await restorePreview(db, id, String(baseline.id));
  const [p] = await db.query(
    "SELECT changes FROM plan_excel_previews WHERE id=$1",
    [restore],
  );
  await confirmPreview(
    db,
    restore,
    (p.changes as Preview["changes"]).map((c) => c.key),
  );
  assert.deepEqual((await readState(db, id)).snapshot, state.snapshot);
});
test("expired previews cannot mutate data", async () => {
  const { id } = await importPlan(),
    update = await updatePreview(id, (state) => {
      state.snapshot.plans[0].title = "Expired";
    });
  await db.query(
    "UPDATE plan_excel_previews SET expires_at=now()-interval '1 minute' WHERE id=$1",
    [update.preview],
  );
  await assert.rejects(
    confirmPreview(
      db,
      update.preview,
      update.changes.map((c) => c.key),
    ),
    /expired/,
  );
  assert.deepEqual(await readState(db, id), update.before);
});
test("all module tables advance content version during normal builder edits", async () => {
  const { id } = await importPlan(),
    state = await readState(db, id);
  const destinationId = state.snapshot.destinations[0].id;
  for (const table of [
    "places",
    "transports",
    "foods",
    "experiences",
    "map_pins",
    "destination_notes",
    "india_guide_items",
    "plan_documents",
  ]) {
    const previous = await readState(db, id);
    const planLevel = ["india_guide_items", "plan_documents"].includes(table);
    const labelField = [
      "destination_notes",
      "india_guide_items",
      "plan_documents",
    ].includes(table)
      ? "title"
      : table === "transports"
        ? null
        : "name";
    await db.query(
      `INSERT INTO ${table}(${planLevel ? "plan_id" : "destination_id"},position${labelField ? "," + labelField : ""}) VALUES($1,0${labelField ? ",$2" : ""})`,
      labelField
        ? [planLevel ? id : destinationId, "Version check"]
        : [destinationId],
    );
    assert.ok(
      BigInt((await readState(db, id)).version) > BigInt(previous.version),
      table,
    );
  }
});
test("wrong plan scope, unsupported columns and oversized uploads reject without mutation", async () => {
  const one = await importPlan(),
    two = await importPlan();
  const state = await readState(db, one.id);
  const buffer = await makeWorkbook(state.snapshot, {
    export_scope: one.id,
    content_version: state.version,
  });
  const request = (body: Buffer, plan = two.id, filename = "workbook.xlsx") =>
    new Request(
      `https://stay.local/admin/plans/excel?mode=preview&plan=${plan}`,
      {
        method: "POST",
        headers: { origin: "https://stay.local", "x-file-name": filename },
        body: new Uint8Array(body),
      },
    );
  assert.equal(
    (await handleExcelRequest(request(buffer), db, async () => true)).status,
    409,
  );
  assert.equal(
    (
      await handleExcelRequest(
        request(Buffer.alloc(3 * 1024 * 1024 + 1)),
        db,
        async () => true,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleExcelRequest(
        request(buffer, one.id, "file.docx"),
        db,
        async () => true,
      )
    ).status,
    400,
  );
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(buffer as never);
  book.getWorksheet("Plan Overview")!.getCell("N1").value = "private_token";
  await assert.rejects(
    parseWorkbook(Buffer.from(await book.xlsx.writeBuffer())),
    /headers do not match/,
  );
});
test("migration can be applied again without changing plan content", async () => {
  const { id } = await importPlan(),
    before = await readState(db, id);
  await pg.exec(await readFile("lib/plan/schema-6-excel.sql", "utf8"));
  assert.deepEqual(await readState(db, id), before);
});

test("moving surviving children before deleting their old destination avoids cascade loss", async () => {
  const { id } = await importPlan();
  const nextDestination = randomUUID();
  const update = await updatePreview(id, (state) => {
    state.snapshot.destinations = [
      {
        ...state.snapshot.destinations[0],
        id: nextDestination,
        name: "Port Blair",
      },
    ];
    state.snapshot.itinerary_days[0].destination_id = nextDestination;
    state.snapshot.stays[0].destination_id = nextDestination;
  });
  await confirmPreview(
    db,
    update.preview,
    update.changes.map((c) => c.key),
  );
  const after = await readState(db, id);
  assert.equal(after.snapshot.itinerary_days.length, 1);
  assert.equal(after.snapshot.stays.length, 1);
  assert.equal(
    after.snapshot.itinerary_days[0].destination_id,
    nextDestination,
  );
});

test("numeric cells in descriptive price fields normalize to database text", async () => {
  const data = parsed();
  data.rows[3].values.price_category = 2500;
  const result = mergeWorkbook(data, emptySnapshot(), randomUUID());
  assert.deepEqual(result.errors, []);
  assert.equal(result.snapshot.stays[0].price_category, "2500");
});
