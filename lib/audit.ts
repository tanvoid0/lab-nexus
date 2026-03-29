import { revalidatePath } from "next/cache";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  userId?: string | null;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  diff?: unknown;
  /** Set when writing many rows in one request (e.g. overdue batch); caller should revalidate once. */
  skipRevalidate?: boolean;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? undefined,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      diff: input.diff === undefined ? undefined : (input.diff as object),
    },
  });
  if (!input.skipRevalidate) {
    revalidatePath("/admin/audit");
  }
}
