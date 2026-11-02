import ExcelJS from "exceljs";
import { unzipSync, strFromU8 } from "fflate";
import {
  SECTIONS,
  VERSION,
  MAX_BYTES,
  MAX_ROWS,
  columns,
  type Snapshot,
  type Value,
} from "./schema";

export interface WorkbookRow {
  sheet: string;
  row: number;
  values: Record<string, Value>;
}
export interface ParsedWorkbook {
  metadata: Record<string, string>;
  rows: WorkbookRow[];
}
export class WorkbookError extends Error {}
const instructions = [
  ["STAYLOCAL • Excel Plan Builder", "Template version: " + VERSION],
  [
    "1. Start here",
    "Download a blank template or export a plan. Select the customer in the admin interface for new plans.",
  ],
  [
    "2. Fill in sections",
    "Headers ending in * are required for new records. Dates: YYYY-MM-DD. Positions start at 0; use unique positions per destination/section.",
  ],
  [
    "3. Link records",
    "Choose stable record_key values, such as havelock and day-1. Use the destination record_key in destination_key. Preserve exported keys.",
  ],
  [
    "4. Examples",
    "Rows with action EXAMPLE are ignored. Change EXAMPLE to UPSERT to use a row. Delete unused examples.",
  ],
  [
    "5. Update safely",
    "Blank cells and missing rows preserve existing data. [CLEAR] clears an optional value. DELETE explicitly removes a record; delete all its linked children explicitly too.",
  ],
  [
    "6. Review",
    "Upload, review every change and confirm. You may deselect whole record changes; resulting references must remain valid. Imports are always DRAFT.",
  ],
  [
    "7. Protected settings",
    "Status, access windows, customer, private links and devices are managed only in Plan Builder settings. Never add these columns.",
  ],
  [
    "8. Prices and time",
    "Prices, price categories, durations and timing are descriptive text, as in Plan Builder (for example INR 2,500 per person; 08:00 ferry).",
  ],
  [
    "9. Recover",
    "Fix the reported sheet/row/column and upload again. For conflicts, export a fresh copy. Excel revisions can be inspected/restored from the import screen.",
  ],
  [
    "10. Security",
    "Only .xlsx up to 3 MiB. No formulas, macros, external links or embedded objects. Paste plain values. Text: 10,000 characters; title/name/key: 200/80.",
  ],
  [
    "Journey",
    "The Destinations sheet defines Journey order and card artwork. Help stores plan-level support details. There is no separate Journey table.",
  ],
];
export async function makeWorkbook(
  snapshot?: Snapshot,
  metadata: Record<string, string> = {},
  examples = false,
): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  book.creator = "StayLocal";
  const intro = book.addWorksheet("Instructions");
  instructions.forEach((row) => intro.addRow(row));
  intro.columns = [{ width: 30 }, { width: 110 }];
  intro.eachRow((row) => {
    row.height = 45;
    row.alignment = { wrapText: true, vertical: "middle" };
  });
  const meta = book.addWorksheet("Metadata");
  meta.addRow(["key", "value"]);
  Object.entries({
    template_version: VERSION,
    export_scope: "",
    content_version: "",
    ...metadata,
  }).forEach((row) => meta.addRow(row));
  meta.columns = [{ width: 30 }, { width: 80 }];
  for (const section of SECTIONS) {
    const sheet = book.addWorksheet(section.sheet, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const headers = columns(section);
    sheet.addRow(
      headers.map(
        (h) =>
          h +
          (section.fields.some((f) => f.name === h && f.required) ||
          h === "record_key" ||
          h === "destination_key"
            ? "*"
            : ""),
      ),
    );
    const records = snapshot?.[section.table] ?? [];
    for (const record of records) {
      sheet.addRow(
        headers.map((h) =>
          h === "record_key"
            ? `r_${record.id}`
            : h === "action"
              ? "UPSERT"
              : h === "destination_key"
                ? `r_${record.destination_id}`
                : (record[h] ?? ""),
        ),
      );
    }
    if (examples && !records.length) {
      const example: Record<string, Value> = {
        record_key:
          section.table === "plans"
            ? "plan"
            : section.table === "destinations"
              ? "havelock"
              : `${section.table}-1`,
        action: "EXAMPLE",
        destination_key: "havelock",
        position: 0,
        title: "Andaman island escape",
        name: "Havelock",
        day_label: "Day 1",
        morning: "Arrive and settle in",
        transport_type: "OTHER",
        priority: "RECOMMENDED",
        note_type: "LOCAL_TIP",
        category: section.table === "map_pins" ? "PLACE" : "PRACTICAL",
      };
      sheet.addRow(headers.map((h) => example[h] ?? ""));
      sheet.getRow(2).font = { italic: true, color: { argb: "FF6B7280" } };
    }
    sheet.columns.forEach((column, index) => {
      column.width = headers[index].includes("key") ? 40 : 28;
      const field = section.fields.find((f) => f.name === headers[index]);
      if (field?.type === "date") column.numFmt = "yyyy-mm-dd";
      else if (field?.type === "integer") column.numFmt = "0";
      else column.numFmt = "@";
      const values =
        headers[index] === "action"
          ? ["UPSERT", "DELETE", "EXAMPLE"]
          : field?.values;
      if (values)
        for (let row = 2; row <= 501; row++)
          sheet.getCell(row, index + 1).dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${values.join(",")}"`],
            showErrorMessage: true,
            error: "Choose a value from the dropdown.",
          };
      if (field?.required || headers[index].endsWith("key"))
        sheet.getCell(1, index + 1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF964C32" },
        };
    });
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(2, sheet.rowCount), column: headers.length },
    };
    sheet.eachRow((row) => {
      row.alignment = { vertical: "top", wrapText: true };
    });
  }
  for (const sheet of book.worksheets) {
    sheet.getRow(1).height = 32;
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      if (!cell.fill || cell.fill.type !== "pattern")
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF174D3C" },
        };
    });
  }
  return Buffer.from(await book.xlsx.writeBuffer());
}

// Read central-directory sizes BEFORE decompression. Bound actual inflated bytes too.
export function preflight(buffer: Buffer) {
  if (
    buffer.length > MAX_BYTES ||
    buffer.length < 22 ||
    buffer.readUInt32LE(0) !== 0x04034b50
  )
    throw new WorkbookError("Upload a valid .xlsx file of at most 3 MiB.");
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--)
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new WorkbookError("Malformed workbook ZIP directory.");
  const count = buffer.readUInt16LE(end + 10);
  if (
    count > 150 ||
    buffer.readUInt16LE(end + 4) !== 0 ||
    buffer.readUInt16LE(end + 6) !== 0
  )
    throw new WorkbookError(
      "Workbook has too many parts or uses an unsupported ZIP format.",
    );
  let offset = buffer.readUInt32LE(end + 16),
    total = 0;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50)
      throw new WorkbookError("Malformed workbook ZIP directory.");
    if (buffer.readUInt16LE(offset + 8) & 1)
      throw new WorkbookError("Encrypted workbooks are unsupported.");
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    total += size;
    if (total > 16 * 1024 * 1024 || size > 8 * 1024 * 1024)
      throw new WorkbookError("Workbook expands beyond the safe size limit.");
    if (
      /externalLinks|vbaProject|embeddings|connections|queryTables|activeX|xl\/media\/|xl\/drawings\/|xl\/charts\//i.test(
        name,
      )
    )
      throw new WorkbookError(
        "Macros, external data and embedded objects are unsupported.",
      );
    offset +=
      46 +
      nameLength +
      buffer.readUInt16LE(offset + 30) +
      buffer.readUInt16LE(offset + 32);
  }
  // fflate filter rejects mismatched local sizes before allocation/inflation.
  let actual = 0;
  const files = unzipSync(buffer, {
    filter: (file) => {
      actual += file.originalSize;
      if (actual > 16 * 1024 * 1024 || file.originalSize > 8 * 1024 * 1024)
        throw new WorkbookError("Workbook exceeds decompression limits.");
      return true;
    },
  });
  if (!files["xl/workbook.xml"] || !files["[Content_Types].xml"])
    throw new WorkbookError("This file is not an Excel workbook.");
  for (const [name, bytes] of Object.entries(files))
    if (/\.(xml|rels)$/i.test(name)) {
      const xml = strFromU8(bytes);
      if (
        (name === "[Content_Types].xml" &&
          /macroEnabled|vbaProject|oleObject/i.test(xml)) ||
        /<!DOCTYPE|<!ENTITY|<(?:[A-Za-z_][\w.-]*:)?f(?:\s|\/|>)/i.test(xml) ||
        /<f(?:\s|\/|>)/i.test(xml) ||
        /TargetMode\s*=\s*["']External["']/i.test(xml)
      )
        throw new WorkbookError(
          "Formulas, external links and XML entities are not allowed. Paste plain values.",
        );
      if (/sheetData/i.test(name) && bytes.length > 8 * 1024 * 1024)
        throw new WorkbookError("Worksheet is too large.");
    }
}
export async function parseWorkbook(buffer: Buffer): Promise<ParsedWorkbook> {
  try {
    preflight(buffer);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(
      buffer as unknown as Parameters<typeof book.xlsx.load>[0],
    );
    const metadata: Record<string, string> = {};
    const rows: WorkbookRow[] = [];
    let count = 0;
    for (const sheet of book.worksheets) {
      if (sheet.rowCount > MAX_ROWS + 2 || sheet.columnCount > 40)
        throw new WorkbookError(`${sheet.name}: too many rows or columns.`);
      sheet.eachRow((row) =>
        row.eachCell((cell) => {
          if (
            cell.type === ExcelJS.ValueType.Formula ||
            cell.type === ExcelJS.ValueType.Hyperlink
          )
            throw new WorkbookError(
              `${sheet.name} → ${cell.address}: formulas and hyperlinks are unsupported.`,
            );
        }),
      );
      if (sheet.name === "Instructions") continue;
      if (sheet.name === "Metadata") {
        sheet.eachRow((row, n) => {
          if (n > 1) {
            const key = String(row.getCell(1).value ?? "");
            if (key in metadata)
              throw new WorkbookError("Metadata: duplicate key.");
            metadata[key] = String(row.getCell(2).value ?? "");
          }
        });
        continue;
      }
      const section = SECTIONS.find((s) => s.sheet === sheet.name);
      if (!section)
        throw new WorkbookError(
          `${sheet.name}: unsupported worksheet; remove it or use the current template.`,
        );
      const headers: string[] = [];
      sheet
        .getRow(1)
        .eachCell({ includeEmpty: true }, (cell) =>
          headers.push(String(cell.value ?? "").replace(/\*$/, "")),
        );
      if (JSON.stringify(headers) !== JSON.stringify(columns(section)))
        throw new WorkbookError(
          `${sheet.name} → Row 1: headers do not match the template.`,
        );
      sheet.eachRow((row, n) => {
        if (n === 1 || !row.hasValues) return;
        const values: Record<string, Value> = {};
        headers.forEach((header, i) => {
          const raw = row.getCell(i + 1).value;
          if (raw == null) values[header] = null;
          else if (raw instanceof Date)
            values[header] = raw.toISOString().slice(0, 10);
          else if (typeof raw === "string" || typeof raw === "number")
            values[header] = raw;
          else
            throw new WorkbookError(
              `${sheet.name} → Row ${n} → ${header}: use plain text, a date or a number.`,
            );
        });
        if (Object.values(values).every((v) => v == null || v === "")) return;
        if (++count > MAX_ROWS)
          throw new WorkbookError(
            `A workbook may contain at most ${MAX_ROWS} records.`,
          );
        if (values.action !== "EXAMPLE")
          rows.push({ sheet: section.sheet, row: n, values });
      });
    }
    if (metadata.template_version !== VERSION)
      throw new WorkbookError(
        "Metadata → template_version: unsupported version. Download a current template.",
      );
    if (!book.getWorksheet("Plan Overview"))
      throw new WorkbookError("Plan Overview worksheet is required.");
    return { metadata, rows };
  } catch (error) {
    if (error instanceof WorkbookError) throw error;
    throw new WorkbookError(
      "Malformed or unsupported workbook. Open the current template in Excel and save as .xlsx.",
    );
  }
}
