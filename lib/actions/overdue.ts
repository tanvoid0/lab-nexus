import { revalidatePath } from "next/cache";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildOverdueBorrowerEmail } from "@/lib/email/templates/overdue-borrower";
import { isEmailConfigured, sendEmailResend } from "@/lib/email/resend";

export type MarkOverdueOptions = {
  /** When set (e.g. manual refresh from Admin), attributed to that user; cron leaves unset. */
  actorUserId?: string | null;
};

/** Mark active checkouts past due as OVERDUE (idempotent) and create in-app notifications. */
export async function markOverdueCheckouts(options?: MarkOverdueOptions) {
  const now = new Date();
  const due = await prisma.checkout.findMany({
    where: { status: "ACTIVE", dueAt: { lt: now } },
    include: {
      asset: { select: { name: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (due.length === 0) return 0;

  for (const c of due) {
    await prisma.checkout.update({
      where: { id: c.id },
      data: { status: "OVERDUE" },
    });
    await writeAuditLog({
      userId: options?.actorUserId ?? undefined,
      entityType: AuditEntityType.Checkout,
      entityId: c.id,
      action: AuditAction.STATUS_OVERDUE,
      diff: {
        assetId: c.assetId,
        dueAt: c.dueAt.toISOString(),
        previousStatus: "ACTIVE",
      },
      skipRevalidate: true,
    });
  }

  revalidatePath("/admin/audit");

  await prisma.notification.createMany({
    data: due.map((c) => ({
      userId: c.userId,
      title: "Equipment overdue",
      body: `${c.asset.name} was due ${c.dueAt.toLocaleString()}. Please return or contact the lab.`,
    })),
  });

  if (isEmailConfigured()) {
    await Promise.allSettled(
      due.map((c) => {
        const { subject, html, text } = buildOverdueBorrowerEmail({
          recipientName: c.user.name,
          assetName: c.asset.name,
          dueAtLabel: c.dueAt.toLocaleString(),
          assetId: c.assetId,
        });
        return sendEmailResend({ to: c.user.email, subject, html, text });
      }),
    );
  }

  return due.length;
}
