"use server";

import { auth } from "@/auth";
import { assertAnyRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  success,
  type ActionResult,
} from "@/lib/form/action-result";
import { prisma } from "@/lib/db";
import { AssetCondition, AssetOperationalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

function cellString(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

export async function importSpreadsheetAction(
  _prev: ActionResult<{ imported: number; skipped: number }>,
  formData: FormData,
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, ["ADMIN", "RESEARCHER"]);
  } catch {
    return failure({ formError: "Forbidden." });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return failure({ formError: "Choose an .xlsx or .csv file." });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buf, { type: "buffer" });
  } catch {
    return failure({ formError: "Could not read spreadsheet." });
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return failure({ formError: "Empty workbook." });

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
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
      continue;
    }
    const skuOrInternalId =
      sku || `IMPORT-${name.slice(0, 40)}-${imported + skipped}`.replace(/\s+/g, "-");

    const qtyRaw = cellString(row, ["Number", "quantity", "Quantity", "Qty"]);
    const qty = Math.max(1, parseInt(qtyRaw, 10) || 1);

    const notes = cellString(row, ["Notes", "notes", "Additional Notes", "additional notes"]);
    const quoteUrl = cellString(row, ["Quote", "quote", "URL", "url"]);

    const dup = await prisma.asset.findUnique({
      where: { skuOrInternalId },
    });
    if (dup) {
      skipped++;
      continue;
    }
    try {
      await prisma.asset.create({
        data: {
          skuOrInternalId,
          name: name || skuOrInternalId,
          quantityTotal: qty,
          quantityAvailable: qty,
          condition: AssetCondition.UNKNOWN,
          operationalStatus: AssetOperationalStatus.AVAILABLE,
          notes: notes || undefined,
          quoteUrl: quoteUrl || undefined,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "Import",
    entityId: "spreadsheet",
    action: "IMPORT",
    diff: { imported, skipped, fileName: file.name },
  });

  revalidatePath("/inventory");
  revalidatePath("/admin");
  return success({ imported, skipped });
}
