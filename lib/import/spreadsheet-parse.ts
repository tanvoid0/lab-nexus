import * as XLSX from "xlsx";

export function cellString(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

export type ParsedSpreadsheet = {
  sheetName: string;
  rowCount: number;
  /** Header cells from the first row when present (trimmed string keys). */
  headers: string[];
  rows: Record<string, unknown>[];
};

export function parseSpreadsheetBuffer(buf: Buffer):
  | { ok: true; value: ParsedSpreadsheet }
  | { ok: false; error: string } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buf, { type: "buffer" });
  } catch {
    return { ok: false, error: "Could not read spreadsheet." };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) return { ok: false, error: "Empty workbook." };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const headers =
    rows.length > 0
      ? Object.keys(rows[0] ?? {}).map((h) => String(h).trim()).filter(Boolean)
      : [];

  return {
    ok: true,
    value: {
      sheetName,
      rowCount: rows.length,
      headers,
      rows,
    },
  };
}
