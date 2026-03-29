import type { PrismaClient } from "@prisma/client";
import {
  DEFAULT_CONDITION_CODE,
  DEFAULT_OPERATIONAL_STATUS_CODE,
} from "@/lib/reference/lookup-defaults";
import { cellString } from "@/lib/import/spreadsheet-parse";

export type ImportRowPlanStatus =
  | "empty"
  | "duplicate"
  | "imported"
  | "skipped_error";

export type ImportRowPlan = {
  rowNum: number;
  status: ImportRowPlanStatus;
  /** Resolved display name (or SKU fallback). */
  label: string;
  skuOrInternalId: string | null;
};

export type SpreadsheetImportSummary = {
  totalRows: number;
  imported: number;
  skipped: number;
  empty: number;
  duplicate: number;
  errors: number;
};

export type SpreadsheetImportRunResult = {
  summary: SpreadsheetImportSummary;
  /** Full per-row outcomes (same order as sheet rows). */
  plans: ImportRowPlan[];
};

/**
 * Walks sheet rows using the same heuristics as legacy import: loose column names,
 * generated IMPORT-* SKUs, duplicate detection against DB plus earlier rows in this file.
 */
export async function runSpreadsheetImport(
  prisma: PrismaClient,
  rows: Record<string, unknown>[],
  mode: "preview" | "apply",
): Promise<SpreadsheetImportRunResult> {
  const existing = await prisma.asset.findMany({
    where: { deletedAt: null },
    select: { skuOrInternalId: true },
  });
  const skuSet = new Set(existing.map((a) => a.skuOrInternalId));

  let imported = 0;
  let skipped = 0;
  let empty = 0;
  let duplicate = 0;
  let errors = 0;

  const plans: ImportRowPlan[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNum = i + 1;

    const name = cellString(row, [
      "Category",
      "category",
      "Name",
      "name",
      "Item",
      "item",
    ]);
    const sku = cellString(row, ["SKU", "sku", "Number", "number", "ID", "id"]);

    if (!name && !sku) {
      skipped++;
      empty++;
      plans.push({
        rowNum,
        status: "empty",
        label: "(no name or SKU)",
        skuOrInternalId: null,
      });
      continue;
    }

    const skuOrInternalId =
      sku || `IMPORT-${name.slice(0, 40)}-${imported + skipped}`.replace(/\s+/g, "-");

    const label = name || skuOrInternalId;

    if (skuSet.has(skuOrInternalId)) {
      skipped++;
      duplicate++;
      plans.push({
        rowNum,
        status: "duplicate",
        label,
        skuOrInternalId,
      });
      continue;
    }

    const qtyRaw = cellString(row, ["Number", "quantity", "Quantity", "Qty"]);
    const qty = Math.max(1, parseInt(qtyRaw, 10) || 1);

    const notes = cellString(row, ["Notes", "notes", "Additional Notes", "additional notes"]);
    const quoteUrl = cellString(row, ["Quote", "quote", "URL", "url"]);

    if (mode === "preview") {
      skuSet.add(skuOrInternalId);
      imported++;
      plans.push({
        rowNum,
        status: "imported",
        label,
        skuOrInternalId,
      });
      continue;
    }

    try {
      await prisma.asset.create({
        data: {
          skuOrInternalId,
          name: name || skuOrInternalId,
          quantityTotal: qty,
          quantityAvailable: qty,
          conditionCode: DEFAULT_CONDITION_CODE,
          operationalStatusCode: DEFAULT_OPERATIONAL_STATUS_CODE,
          notes: notes || undefined,
          quoteUrl: quoteUrl || undefined,
        },
      });
      skuSet.add(skuOrInternalId);
      imported++;
      plans.push({
        rowNum,
        status: "imported",
        label,
        skuOrInternalId,
      });
    } catch {
      skipped++;
      errors++;
      plans.push({
        rowNum,
        status: "skipped_error",
        label,
        skuOrInternalId,
      });
    }
  }

  return {
    summary: {
      totalRows: rows.length,
      imported,
      skipped,
      empty,
      duplicate,
      errors,
    },
    plans,
  };
}
