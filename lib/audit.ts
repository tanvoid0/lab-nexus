import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  diff?: unknown;
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
}
