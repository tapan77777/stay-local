import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { readFile, writeFile } from "node:fs/promises";
import { createHmac, randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { chromium } from "playwright";
import {
  configuration,
  identity,
  ASSERT_TARGET,
  BRANCH,
  PROJECT,
  ROOT,
  fingerprintSQL,
  safeFailure,
} from "./guard.mjs";
import { readState } from "../../lib/plan/excel/store";
import {
  contentMutationCommands,
  transactionSettings,
  retryTransaction,
} from "../../lib/plan/transactions";
const check = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};
const equal = (a: unknown, b: unknown, message: string) =>
  check(JSON.stringify(a) === JSON.stringify(b), message);
const checks: Record<string, unknown> = new Proxy(
  {},
  {
    set(target: Record<string, unknown>, key: string, value: unknown) {
      target[key] = value;
      if (typeof value === "boolean")
        console.log(JSON.stringify({ check: key, passed: value }));
      return true;
    },
  },
);
let server: ReturnType<typeof spawn> | undefined,
  browser: Awaited<ReturnType<typeof chromium.launch>> | undefined,
  dir = "";
async function main() {
  try {
    const config = await configuration();
    console.log(await identity(config));
    const latest = JSON.parse(
      await readFile(
        new URL(".env.excel-predeploy/latest-recovery.json", ROOT),
        "utf8",
      ),
    );
    const recovery = JSON.parse(await readFile(latest.receipt, "utf8"));
    dir = recovery.backupDirectory;
    const migration = JSON.parse(
      await readFile(dir + "/migration-result.json", "utf8"),
    );
    check(
      recovery.restorePassed && migration.passed && migration.branch === BRANCH,
      "VERIFIED_MIGRATION_REQUIRED",
    );
    const baseline = JSON.parse(
      await readFile(dir + "/baseline.private.json", "utf8"),
    ).baseline;
    const sql = config.sql;
    const tx = async (
      commands: { text: string; values: unknown[] }[],
      readOnly = false,
    ) =>
      retryTransaction(async () => {
        const r = await sql.transaction(
          [
            sql.query(ASSERT_TARGET),
            ...commands.map((c) => sql.query(c.text, c.values)),
          ],
          { readOnly },
        );
        return r.slice(1);
      });
    const db = {
      query: async (text: string, values: unknown[] = []) => {
        const r = await tx([{ text, values }], /^\s*SELECT\b/i.test(text));
        return r[0];
      },
      transaction: async (commands: { text: string; values: unknown[] }[]) =>
        tx([transactionSettings, ...commands]),
    };
    const originalProtected = async () => {
      const rows = await tx(
        [
          { text: "SELECT set_config('TimeZone','UTC',true)", values: [] },
          { text: fingerprintSQL(baseline), values: [] },
        ],
        true,
      );
      return rows[1][0].fingerprint;
    };
    equal(await originalProtected(), baseline, "PRETEST_BASELINE_CHANGED");
    const testCustomer = randomUUID(),
      runTag = randomUUID().slice(0, 8);
    await identity(config);
    await db.query(
      "INSERT INTO customers(id,name,email,whatsapp) VALUES($1,$2,$3,$4)",
      [
        testCustomer,
        `Excel staging acceptance ${runTag}`,
        `excel-${runTag}@example.invalid`,
        "",
      ],
    );
    const probe = createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = (probe.address() as { port: number }).port;
    await new Promise<void>((r) => probe.close(() => r()));
    const base = `http://127.0.0.1:${port}`;
    const childEnv = {
      ...process.env,
      ...config.env,
      NEXT_TELEMETRY_DISABLED: "1",
    };
    server = spawn(
      process.execPath,
      [
        "--import",
        "./scripts/staging/transport-guard.mjs",
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      { cwd: ROOT, env: childEnv, stdio: ["ignore", "pipe", "pipe"] },
    );
    // Never emit server logs: the copied staging database may contain private data.
    server.stdout?.on("data", () => {});
    server.stderr?.on("data", () => {});
    let ready = false;
    for (let n = 0; n < 100; n++) {
      try {
        if ((await fetch(base + "/admin/login")).status === 200) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    check(ready, "STAGING_APP_START_FAILED");
    const adminSecret = config.env.ADMIN_SESSION_SECRET;
    if (!adminSecret) throw new Error("STAGING_ADMIN_SECRET_REQUIRED");
    const now = Math.floor(Date.now() / 1000),
      body = Buffer.from(
        JSON.stringify({ v: 1, sub: "admin", iat: now, exp: now + 3600 }),
      ).toString("base64url");
    const cookie =
      "sl_admin=" +
      body +
      "." +
      createHmac("sha256", adminSecret).update(body).digest("base64url");
    const request = async (
      mode: string,
      options: {
        plan?: string;
        customer?: string;
        file?: Buffer;
        data?: unknown;
        unauthorized?: boolean;
      } = {},
    ) => {
      const url = new URL(base + "/admin/plans/excel");
      url.searchParams.set("mode", mode);
      if (options.plan) url.searchParams.set("plan", options.plan);
      if (options.customer) url.searchParams.set("customer", options.customer);
      const post = options.file !== undefined || options.data !== undefined;
      return fetch(url, {
        method: post ? "POST" : "GET",
        headers: {
          ...(options.unauthorized ? {} : { cookie }),
          ...(post ? { origin: base } : {}),
          ...(options.file
            ? {
                "x-file-name": "acceptance.xlsx",
                "content-type":
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              }
            : {}),
          ...(options.data ? { "content-type": "application/json" } : {}),
        },
        body: options.file
          ? new Uint8Array(options.file)
          : options.data
            ? JSON.stringify(options.data)
            : undefined,
      });
    };
    const json = async (response: Response, status: number, reason: string) => {
      check(response.status === status, reason);
      return response.json();
    };
    const confirm = async (
      preview: { preview: string; changes: { key: string }[] },
      status = 200,
    ) =>
      json(
        await request("confirm", {
          data: {
            preview: preview.preview,
            selected: preview.changes.map((c) => c.key),
          },
        }),
        status,
        "CONFIRM_STATUS_UNEXPECTED",
      );
    const sample = await readFile(
      new URL("outputs/excel/andaman-sample.xlsx", ROOT),
    );
    checks.authorization =
      (await request("template", { unauthorized: true })).status === 401;
    check(checks.authorization, "UNAUTHORIZED_TEMPLATE_ACCEPTED");
    const imported = await json(
      await request("preview", { customer: testCustomer, file: sample }),
      200,
      "SAMPLE_PREVIEW_FAILED",
    );
    const saved = await confirm(imported),
      planId = String(saved.planId);
    const initial = await readState(db, planId);
    const [settings] = await db.query(
      "SELECT status,customer_id,private_token,max_devices,access_starts_at,access_ends_at FROM plans WHERE id=$1",
      [planId],
    );
    check(
      settings.status === "DRAFT" && settings.customer_id === testCustomer,
      "IMPORTED_PLAN_NOT_DRAFT",
    );
    check(
      initial.snapshot.destinations.length === 1 &&
        initial.snapshot.itinerary_days.length === 1 &&
        initial.snapshot.stays.length === 1,
      "SAMPLE_RECORD_COUNTS_WRONG",
    );
    check(
      initial.snapshot.itinerary_days[0].morning === "08:00 ferry to Havelock",
      "SAMPLE_FERRY_WRONG",
    );
    checks.sampleDraftImport = true;
    checks.sampleCounts = Object.fromEntries(
      Object.entries(initial.snapshot).map(([table, rows]) => [
        table,
        rows.length,
      ]),
    );
    const exportBook = async () => {
      const r = await request("export", { plan: planId });
      check(r.status === 200, "EXPORT_FAILED");
      const b = new ExcelJS.Workbook();
      await b.xlsx.load(Buffer.from(await r.arrayBuffer()) as never);
      return b;
    };
    const set = (
      book: ExcelJS.Workbook,
      sheetName: string,
      row: number,
      column: string,
      value: ExcelJS.CellValue,
    ) => {
      const s = book.getWorksheet(sheetName)!;
      const headers = (s.getRow(1).values as string[]).map((v) =>
        typeof v === "string" ? v.replace(/\*$/, "") : v,
      );
      const col = headers.indexOf(column);
      check(col > 0, "TEST_COLUMN_MISSING");
      s.getCell(row, col).value = value;
    };
    const uploadBook = async (book: ExcelJS.Workbook, status = 200) =>
      json(
        await request("preview", {
          plan: planId,
          file: Buffer.from(await book.xlsx.writeBuffer()),
        }),
        status,
        "UPDATE_PREVIEW_STATUS_UNEXPECTED",
      );
    const ferry = await exportBook();
    set(ferry, "Itinerary", 2, "morning", "09:30 ferry to Havelock");
    const ferryPreview = await uploadBook(ferry);
    check(
      ferryPreview.changes.length === 1 &&
        ferryPreview.changes[0].fields.length === 1 &&
        ferryPreview.changes[0].fields[0].field === "morning",
      "FERRY_PREVIEW_EXTRA_FIELDS",
    );
    await confirm(ferryPreview);
    const expected = structuredClone(initial.snapshot);
    expected.itinerary_days[0].morning = "09:30 ferry to Havelock";
    equal(
      (await readState(db, planId)).snapshot,
      expected,
      "UNRELATED_CONTENT_CHANGED",
    );
    equal(
      (
        await db.query(
          "SELECT status,customer_id,private_token,max_devices,access_starts_at,access_ends_at FROM plans WHERE id=$1",
          [planId],
        )
      )[0],
      settings,
      "PROTECTED_SETTINGS_CHANGED",
    );
    checks.ferryOnlyUpdate = true;
    const historyBefore = await db.query(
      "SELECT count(*)::int AS n FROM plan_excel_revisions WHERE plan_id=$1",
      [planId],
    );
    const repeated = await confirm(imported);
    check(repeated.planId === planId, "DUPLICATE_CONFIRM_NEW_PLAN");
    const duplicate = await json(
      await request("preview", { customer: testCustomer, file: sample }),
      409,
      "DUPLICATE_UPLOAD_NOT_REJECTED",
    );
    check(duplicate.existingPlanId === planId, "DUPLICATE_UPLOAD_WRONG_PLAN");
    equal(
      await db.query(
        "SELECT count(*)::int AS n FROM plan_excel_revisions WHERE plan_id=$1",
        [planId],
      ),
      historyBefore,
      "DUPLICATE_CONFIRM_NEW_REVISION",
    );
    checks.duplicateProtection = true;
    await json(
      await request("preview", {
        customer: testCustomer,
        file: Buffer.from("invalid workbook"),
      }),
      400,
      "MALFORMED_WORKBOOK_ACCEPTED",
    );
    const invalid = await exportBook();
    set(invalid, "Itinerary", 2, "destination_key", "missing-destination");
    await uploadBook(invalid, 422);
    checks.invalidWorkbookValidation = true;
    const blank = await exportBook();
    set(blank, "Itinerary", 2, "morning", "");
    await uploadBook(blank, 400);
    equal(
      (await readState(db, planId)).snapshot,
      expected,
      "BLANK_OVERWROTE_CONTENT",
    );
    checks.blankPreservation = true;
    const clear = await exportBook();
    set(clear, "Itinerary", 2, "morning", "[CLEAR]");
    await confirm(await uploadBook(clear));
    check(
      (await readState(db, planId)).snapshot.itinerary_days[0].morning === "",
      "EXPLICIT_CLEAR_FAILED",
    );
    checks.explicitClearing = true;
    const remove = await exportBook();
    set(remove, "Stays", 2, "action", "DELETE");
    await confirm(await uploadBook(remove));
    check(
      (await readState(db, planId)).snapshot.stays.length === 0,
      "EXPLICIT_DELETE_FAILED",
    );
    checks.explicitDeletion = true;
    const originalRevision = (
      await db.query(
        "SELECT id FROM plan_excel_revisions WHERE plan_id=$1 AND operation='IMPORT' ORDER BY revision LIMIT 1",
        [planId],
      )
    )[0];
    const restore = await json(
      await request("restore", {
        plan: planId,
        data: { revision: originalRevision.id },
      }),
      200,
      "RESTORE_PREVIEW_FAILED",
    );
    await confirm(restore);
    equal(
      (await readState(db, planId)).snapshot,
      initial.snapshot,
      "REVISION_RESTORE_CONTENT_MISMATCH",
    );
    checks.revisionRestoration = true;
    const full = await exportBook();
    const destinationKey = `r_${initial.snapshot.destinations[0].id}`;
    const additions: Record<string, Record<string, unknown>> = {
      Places: {
        record_key: "acceptance-beach",
        destination_key: destinationKey,
        action: "UPSERT",
        position: 0,
        name: "Radhanagar Beach",
        priority: "MUST_SEE",
        description: "Staging acceptance test",
      },
      Transport: {
        record_key: "acceptance-ferry",
        destination_key: destinationKey,
        action: "UPSERT",
        position: 0,
        transport_type: "OTHER",
        from_location: "Port Blair",
        to_location: "Havelock",
        instructions: "08:00 ferry",
        price_guidance: "INR 2,500 per person",
      },
      Food: {
        record_key: "acceptance-food",
        destination_key: destinationKey,
        action: "UPSERT",
        position: 0,
        name: "Staging seafood recommendation",
        category: "Local food",
        what_to_try: "Grilled fish",
      },
      Experiences: {
        record_key: "acceptance-experience",
        destination_key: destinationKey,
        action: "UPSERT",
        position: 0,
        name: "Staging snorkeling",
        price: "INR 2,000 per person",
        duration: "2 hours",
      },
      Maps: {
        record_key: "acceptance-map",
        destination_key: destinationKey,
        action: "UPSERT",
        position: 0,
        name: "Radhanagar Beach",
        latitude: 11.984,
        longitude: 92.951,
        category: "PLACE",
      },
      Notes: {
        record_key: "acceptance-note",
        destination_key: destinationKey,
        action: "UPSERT",
        position: 0,
        title: "Staging local tip",
        note: "Allow time for the ferry.",
        note_type: "LOCAL_TIP",
      },
      "India Guide": {
        record_key: "acceptance-guide",
        action: "UPSERT",
        position: 0,
        title: "Staging packing guide",
        category: "PACKING",
        content: "Pack reef-safe sun protection.",
      },
      Documents: {
        record_key: "acceptance-doc",
        action: "UPSERT",
        position: 0,
        title: "Staging travel checklist",
        description: "Synthetic acceptance document",
        file_url: "https://example.invalid/checklist.pdf",
      },
    };
    for (const [name, row] of Object.entries(additions)) {
      const sheet = full.getWorksheet(name)!;
      const headers = (sheet.getRow(1).values as string[])
        .slice(1)
        .map((v) => v.replace(/\*$/, ""));
      sheet.addRow(headers.map((key) => row[key] ?? ""));
    }
    await confirm(await uploadBook(full));
    const fullState = await readState(db, planId);
    for (const table of [
      "places",
      "transports",
      "foods",
      "experiences",
      "map_pins",
      "destination_notes",
      "india_guide_items",
      "plan_documents",
    ])
      check(
        fullState.snapshot[table].length === 1,
        "SECTION_NOT_IMPORTED_" + table.toUpperCase(),
      );
    const roundtrip = await uploadBook(await exportBook(), 400);
    check(
      String(roundtrip.error).includes("No changes"),
      "ROUNDTRIP_NOT_UNCHANGED",
    );
    checks.allSupportedSectionsAndRoundtrip = true;
    const stale = await exportBook();
    set(stale, "Itinerary", 2, "morning", "Stale ferry update");
    await db.transaction(
      contentMutationCommands(
        "itinerary_days",
        "record",
        String(fullState.snapshot.itinerary_days[0].id),
        "UPDATE itinerary_days SET notes=$2,updated_at=now() WHERE id=$1",
        [fullState.snapshot.itinerary_days[0].id, "Manual staging edit"],
      ),
    );
    await uploadBook(stale, 409);
    checks.staleExportDetection = true;
    const postPreview = await exportBook();
    set(postPreview, "Itinerary", 2, "morning", "Post-preview stale update");
    const pending = await uploadBook(postPreview);
    await db.transaction(
      contentMutationCommands(
        "itinerary_days",
        "record",
        String(fullState.snapshot.itinerary_days[0].id),
        "UPDATE itinerary_days SET notes=$2,updated_at=now() WHERE id=$1",
        [fullState.snapshot.itinerary_days[0].id, "New manual staging edit"],
      ),
    );
    await confirm(pending, 409);
    checks.postPreviewConflict = true;
    // Two independent app transactions contend for one plan/version.
    const a = await exportBook(),
      b = await exportBook();
    set(a, "Itinerary", 2, "morning", "Concurrent A");
    set(b, "Itinerary", 2, "morning", "Concurrent B");
    const pa = await uploadBook(a),
      pb = await uploadBook(b);
    const confirms = await Promise.all([
      request("confirm", {
        data: {
          preview: pa.preview,
          selected: pa.changes.map((c: { key: string }) => c.key),
        },
      }),
      request("confirm", {
        data: {
          preview: pb.preview,
          selected: pb.changes.map((c: { key: string }) => c.key),
        },
      }),
    ]);
    equal(
      confirms.map((r) => r.status).sort(),
      [200, 409],
      "CONCURRENT_UPDATES_NOT_SERIALIZED",
    );
    const actualMorning = (await readState(db, planId)).snapshot
      .itinerary_days[0].morning;
    check(
      actualMorning ===
        (confirms[0].status === 200 ? "Concurrent A" : "Concurrent B"),
      "CONCURRENT_WINNER_MISMATCH",
    );
    checks.concurrentUpdates = true;
    const dupBook = await exportBook();
    set(
      dupBook,
      "Itinerary",
      2,
      "morning",
      "Duplicate concurrent confirmation",
    );
    const dupPreview = await uploadBook(dupBook);
    const revCount = Number(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM plan_excel_revisions WHERE plan_id=$1",
          [planId],
        )
      )[0].n,
    );
    const duplicates = await Promise.all([
      confirm(dupPreview),
      confirm(dupPreview),
    ]);
    check(
      duplicates.every((r) => r.planId === planId),
      "CONCURRENT_DUPLICATE_NOT_IDEMPOTENT",
    );
    check(
      Number(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM plan_excel_revisions WHERE plan_id=$1",
            [planId],
          )
        )[0].n,
      ) ===
        revCount + 2,
      "CONCURRENT_DUPLICATE_EXTRA_REVISION",
    );
    checks.concurrentDuplicateConfirm = true;
    const manualOverlap = await exportBook();
    set(
      manualOverlap,
      "Itinerary",
      2,
      "morning",
      "Rejected overlapping Excel value",
    );
    const overlapPreview = await uploadBook(manualOverlap);
    const marker = Number.parseInt(runTag.slice(0, 6), 16),
      dayId = String(fullState.snapshot.itinerary_days[0].id);
    const commands = contentMutationCommands(
      "itinerary_days",
      "record",
      dayId,
      "UPDATE itinerary_days SET morning=$2,updated_at=now() WHERE id=$1",
      [dayId, "Manual concurrent winner"],
    );
    commands.splice(
      2,
      0,
      { text: "SELECT pg_advisory_xact_lock(1937006969,$1)", values: [marker] },
      { text: "SELECT pg_sleep(3)", values: [] },
    );
    const manual = db.transaction(commands);
    let observed = false;
    for (let n = 0; n < 15; n++) {
      const r = await db.query(
        "SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory' AND classid::bigint=1937006969 AND objid::bigint=$1 AND granted) AS locked",
        [marker],
      );
      if (r[0].locked) {
        observed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 75));
    }
    check(observed, "MANUAL_CONCURRENCY_NOT_OBSERVED");
    const excel = confirm(overlapPreview, 409);
    await manual;
    await excel;
    check(
      (await readState(db, planId)).snapshot.itinerary_days[0].morning ===
        "Manual concurrent winner",
      "MANUAL_CONCURRENT_WRITE_LOST",
    );
    checks.manualExcelOverlapNoDeadlock = true;
    // Roll back intentional failing DML in a real staging transaction.
    const beforeRollback = await readState(db, planId);
    let rolledBack = false;
    try {
      await db.transaction([
        {
          text: "UPDATE plans SET subtitle=$2 WHERE id=$1",
          values: [planId, "Must roll back"],
        },
        { text: "SELECT 1/0", values: [] },
      ]);
    } catch {
      rolledBack = true;
    }
    check(rolledBack, "EXPECTED_ROLLBACK_FAILURE_NOT_OBSERVED");
    equal(
      await readState(db, planId),
      beforeRollback,
      "REAL_TRANSACTION_ROLLBACK_FAILED",
    );
    checks.realTransactionRollback = true;
    const finalRestore = await json(
      await request("restore", {
        plan: planId,
        data: { revision: originalRevision.id },
      }),
      200,
      "FINAL_RESTORE_PREVIEW_FAILED",
    );
    await confirm(finalRestore);
    equal(
      (await readState(db, planId)).snapshot,
      initial.snapshot,
      "FINAL_RESTORE_FAILED",
    );
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addCookies([
      {
        name: "sl_admin",
        value: cookie.slice(9),
        url: base,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();
    const browserErrors: string[] = [];
    page.on("pageerror", (e) => browserErrors.push(e.message));
    await page.goto(`${base}/admin/plans/${planId}`);
    await page
      .getByLabel("Traveler name", { exact: true })
      .fill(`Manual staging traveler ${runTag}`);
    await page
      .getByRole("button", { name: "Save overview", exact: true })
      .click();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("span")).some(
        (s) => s.textContent === "Saved",
      ),
    );
    check(
      (
        await db.query("SELECT traveler_name FROM plans WHERE id=$1", [planId])
      )[0].traveler_name === `Manual staging traveler ${runTag}`,
      "MANUAL_OVERVIEW_FAILED",
    );
    await page
      .getByRole("button", { name: "+ Add destination", exact: true })
      .click();
    await page
      .getByLabel("Destination name", { exact: true })
      .fill(`Manual staging destination ${runTag}`);
    await page
      .getByRole("button", { name: "Add destination", exact: true })
      .click();
    await page.waitForURL(`**/admin/plans/${planId}/destinations/*`);
    check(
      Number(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM destinations WHERE plan_id=$1",
            [planId],
          )
        )[0].n,
      ) === 2,
      "MANUAL_DESTINATION_CREATE_FAILED",
    );
    await page.goto(`${base}/admin/plans/${planId}`);
    await page
      .getByLabel("Support info", { exact: true })
      .fill("Manual staging support");
    await page.getByRole("button", { name: "Save help", exact: true }).click();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("span")).some(
        (s) => s.textContent === "Saved",
      ),
    );
    check(
      (
        await db.query("SELECT support_info FROM plans WHERE id=$1", [planId])
      )[0].support_info === "Manual staging support",
      "MANUAL_HELP_FAILED",
    );
    equal(browserErrors, [], "STAGING_BROWSER_RUNTIME_ERROR");
    await context.close();
    await browser.close();
    browser = undefined;
    checks.manualPlanBuilderBrowser = true;
    equal(
      await originalProtected(),
      baseline,
      "PREEXISTING_BASELINE_ROWS_CHANGED",
    );
    checks.preexistingBaselineRowsUnchanged = true;
    const result = {
      passed: true,
      branch: BRANCH,
      project: PROJECT,
      checks,
      testCustomerId: testCustomer,
      testPlanId: planId,
      baselineTablesProtected: 14,
      testDataRetainedInStaging: true,
      completedAt: new Date().toISOString(),
    };
    await writeFile(
      dir + "/acceptance-result.json",
      JSON.stringify(result, null, 2),
      { mode: 0o600 },
    );
    console.log(JSON.stringify(result));
  } catch (error) {
    if (dir)
      await writeFile(
        dir + "/acceptance-result.json",
        JSON.stringify({
          passed: false,
          checks,
          failedAt: new Date().toISOString(),
          reason: /^[A-Z_]+$/.test((error as Error).message)
            ? (error as Error).message
            : "Failure details suppressed",
        }),
        { mode: 0o600 },
      );
    safeFailure(error);
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill("SIGTERM");
      await once(server, "exit");
    }
  }
}
main().catch(safeFailure);
