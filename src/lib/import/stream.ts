import { createReadStream } from "fs";
import { createInterface } from "readline";
import ExcelJS from "exceljs";
import { cellToValue } from "@/lib/import/cell";

export type SheetRow = {
  rowNumber: number;
  values: Record<string, unknown>;
};

export async function readHeadersAndPreview(filePath: string, previewLimit = 12) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".csv")) {
    return readCsvPreview(filePath, previewLimit);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("The spreadsheet has no worksheets");
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    headers[col - 1] = String(cell.text || cell.value || `Column ${col}`).trim();
  });
  const preview: SheetRow[] = [];
  let total = 0;
  sheet.eachRow({ includeEmpty: false }, (row, number) => {
    if (number === 1) return;
    total += 1;
    if (preview.length >= previewLimit) return;
    const values: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      const displayed = typeof cell.text === "string" ? cell.text.trim() : "";
      values[header] = displayed || cellToValue(cell.value);
    });
    preview.push({ rowNumber: number, values });
  });
  return { headers: headers.filter(Boolean), preview, totalRows: total };
}

export async function iterateSheetRows(
  filePath: string,
  onRow: (row: SheetRow) => Promise<void> | void,
  options?: { fromRowNumber?: number },
) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".csv")) {
    await iterateCsv(filePath, onRow, options?.fromRowNumber ?? 0);
    return;
  }

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    entries: "emit",
    sharedStrings: "cache",
    worksheets: "emit",
  });

  let headers: string[] = [];
  for await (const worksheetReader of workbook) {
    for await (const row of worksheetReader) {
      const cells = (row.values as unknown[]) || [];
      if (row.number === 1) {
        headers = cells.slice(1).map((value, index) => String(cellToValue(value) || `Column ${index + 1}`).trim());
        continue;
      }
      if ((options?.fromRowNumber ?? 0) >= row.number) continue;
      const values: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        values[header] = cellToValue(cells[index + 1]);
      });
      await onRow({ rowNumber: row.number, values });
    }
    break;
  }
}

async function readCsvPreview(filePath: string, previewLimit: number) {
  const preview: SheetRow[] = [];
  let headers: string[] = [];
  let total = 0;
  const rl = createInterface({ input: createReadStream(filePath, { encoding: "utf8" }) });
  let number = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    number += 1;
    const cols = splitCsvLine(line);
    if (number === 1) {
      headers = cols;
      continue;
    }
    total += 1;
    if (preview.length < previewLimit) {
      const values: Record<string, unknown> = {};
      headers.forEach((header, i) => {
        values[header] = cols[i] ?? "";
      });
      preview.push({ rowNumber: number, values });
    }
  }
  return { headers, preview, totalRows: total };
}

async function iterateCsv(
  filePath: string,
  onRow: (row: SheetRow) => Promise<void> | void,
  fromRowNumber: number,
) {
  const rl = createInterface({ input: createReadStream(filePath, { encoding: "utf8" }) });
  let headers: string[] = [];
  let number = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    number += 1;
    const cols = splitCsvLine(line);
    if (number === 1) {
      headers = cols;
      continue;
    }
    if (fromRowNumber >= number) continue;
    const values: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      values[header] = cols[i] ?? "";
    });
    await onRow({ rowNumber: number, values });
  }
}

function splitCsvLine(line: string) {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((v) => v.trim());
}
