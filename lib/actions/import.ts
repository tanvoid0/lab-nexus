"use server";

import { randomUUID } from "node:crypto";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { auth } from "@/auth";
import { assertAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  success,
  type ActionResult,
} from "@/lib/form/action-result";
import { prisma } from "@/lib/db";
import { parseSpreadsheetBuffer } from "@/lib/import/spreadsheet-parse";
import {
  runSpreadsheetImport,
  type ImportRowPlan,
  type SpreadsheetImportSummary,
} from "@/lib/import/spreadsheet-row-plan";
import { revalidatePath } from "next/cache";

export type ImportSpreadsheetActionData =
  | {
      kind: "apply";
      imported: number;
      skipped: number;
      /** Rows that failed at insert time (rare). */
      errors: number;
    }
  | {
      kind: "preview";
      fileName: string;
      sheetName: string;
      headers: string[];
      summary: SpreadsheetImportSummary;
      plans: ImportRowPlan[];
    };

export async function importSpreadsheetAction(
  _prev: ActionResult<ImportSpreadsheetActionData>,
  formData: FormData,
): Promise<ActionResult<ImportSpreadsheetActionData>> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, LAB_ROLES_STAFF);
  } catch {
    return failure({ formError: "Forbidden." });
  }

  const intent = String(formData.get("intent") ?? "apply");
  const mode = intent === "preview" ? "preview" : "apply";

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return failure({ formError: "Choose an .xlsx or .csv file." });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = parseSpreadsheetBuffer(buf);
  if (!parsed.ok) {
    return failure({ formError: parsed.error });
  }

  const { rows, sheetName, headers } = parsed.value;

  if (mode === "preview") {
    const { summary, plans } = await runSpreadsheetImport(prisma, rows, "preview");
    return success({
      kind: "preview",
      fileName: file.name,
      sheetName,
      headers,
      summary,
      plans,
    });
  }

  const { summary } = await runSpreadsheetImport(prisma, rows, "apply");

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Import,
    entityId: randomUUID(),
    action: AuditAction.IMPORT,
    diff: {
      imported: summary.imported,
      skipped: summary.skipped,
      fileName: file.name,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/admin");
  return success({
    kind: "apply",
    imported: summary.imported,
    skipped: summary.skipped,
    errors: summary.errors,
  });
}
