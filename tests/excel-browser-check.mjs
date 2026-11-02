// Optional real Chromium pass against ONLY the disposable running-app harness.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
export async function verifyBrowser({ base, cookie, planId, pg }) {
  const { chromium } = await import(
    process.env.STAYLOCAL_PLAYWRIGHT_MODULE || "playwright"
  );
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies([
    {
      name: "sl_admin",
      value: cookie.slice("sl_admin=".length),
      url: base,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const out = "outputs/excel/browser";
  await mkdir(out, { recursive: true });
  const summary = [];
  const exportBook = async () => {
    const res = await fetch(
      `${base}/admin/plans/excel?mode=export&plan=${planId}`,
      { headers: { cookie } },
    );
    assert.equal(res.status, 200);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(Buffer.from(await res.arrayBuffer()));
    return book;
  };
  const content = (book) =>
    Object.fromEntries(
      book.worksheets
        .filter((s) => !["Metadata", "Instructions"].includes(s.name))
        .map((s) => [s.name, s.getSheetValues()]),
    );
  try {
    await page.goto(`${base}/admin/plans/import`);
    await page
      .getByRole("heading", { name: "Import a new plan", exact: true })
      .waitFor();
    await page.screenshot({
      path: `${out}/desktop-import.png`,
      fullPage: true,
    });
    const book = await exportBook(),
      sheet = book.getWorksheet("Itinerary");
    const headers = sheet.getRow(1).values;
    sheet.getCell(2, headers.indexOf("morning")).value =
      "09:30 ferry to Havelock";
    const expected = content(book);
    await page.goto(`${base}/admin/plans/import?plan=${planId}`);
    await page.getByLabel("Excel workbook").setInputFiles({
      name: "andaman-update.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from(await book.xlsx.writeBuffer()),
    });
    await page
      .getByRole("button", { name: "Validate and preview", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Update preview", exact: true })
      .waitFor();
    await page
      .locator("summary")
      .filter({ hasText: "Inspect" })
      .first()
      .click();
    assert.equal(await page.getByRole("checkbox").count(), 1);
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);
      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      assert.ok(
        overflow.document <= overflow.viewport + 1,
        JSON.stringify({ viewport, overflow }),
      );
      const confirm = page.getByRole("button", {
        name: "Confirm selected changes",
        exact: true,
      });
      await confirm.scrollIntoViewIfNeeded();
      assert.ok(await confirm.isEnabled());
      await page.screenshot({
        path: `${out}/preview-${viewport.width}.png`,
        fullPage: true,
      });
      summary.push({
        width: viewport.width,
        height: viewport.height,
        noDocumentOverflow: true,
        confirmationEnabled: true,
      });
    }
    await page
      .getByRole("button", { name: "Confirm selected changes", exact: true })
      .click();
    await page.waitForURL(`**/admin/plans/${planId}?excel=saved`);
    await page
      .getByRole("status")
      .filter({ hasText: "saved successfully" })
      .waitFor();
    assert.deepEqual(
      content(await exportBook()),
      expected,
      "Only the intended ferry text changed",
    );
    // Exercise the real normal-builder child write service, not a mirrored SQL test.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page
      .getByRole("button", { name: "+ Add destination", exact: true })
      .click();
    await page
      .getByLabel("Destination name", { exact: true })
      .fill("Browser manual destination");
    await page
      .getByRole("button", { name: "Add destination", exact: true })
      .click();
    await page.waitForURL(`**/admin/plans/${planId}/destinations/*`);
    await page
      .getByRole("heading", { name: "Browser manual destination", exact: true })
      .waitFor();
    const rows = await pg.query(
      "SELECT name FROM destinations WHERE plan_id=$1 AND name='Browser manual destination'",
      [planId],
    );
    assert.equal(rows.rows.length, 1);
    await page.goto(`${base}/admin/plans/import?plan=${planId}`);
    await page
      .getByRole("button", { name: "Load revision history", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Inspect / restore" })
      .first()
      .waitFor();
    await page
      .getByRole("button", { name: "Inspect / restore" })
      .first()
      .click();
    await page
      .getByRole("heading", { name: "Revision restore preview", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Cancel preview", exact: true })
      .click();
    await page.getByLabel("Excel workbook").setInputFiles({
      name: "malformed.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("invalid"),
    });
    await page
      .getByRole("button", { name: "Validate and preview", exact: true })
      .click();
    const validationError = page
      .getByRole("alert")
      .filter({ hasText: "valid .xlsx" });
    await validationError.waitFor();
    assert.match(await validationError.innerText(), /valid .xlsx/);
    assert.deepEqual(errors, [], "No browser runtime errors");
    await writeFile(
      `${out}/results.json`,
      JSON.stringify(
        {
          engine: "Chromium (installed Google Chrome)",
          database: "disposable PGlite only",
          viewports: summary,
          manualDestinationService: true,
          ferryOnlyChange: true,
          historyAndRestorePreview: true,
          malformedWorkbookError: true,
          browserErrors: errors,
        },
        null,
        2,
      ),
    );
    console.log(
      "Browser PASS: desktop 1440 and mobile 390/320, ferry-only UI update, normal builder child creation, history/restore preview, validation error and no runtime errors.",
    );
  } finally {
    await context.close();
    await browser.close();
  }
}
