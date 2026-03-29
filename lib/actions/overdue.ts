import { prisma } from "@/lib/db";
import { isEmailConfigured, sendEmailResend } from "@/lib/email/resend";

/** Mark active checkouts past due as OVERDUE (idempotent) and create in-app notifications. */
export async function markOverdueCheckouts() {
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
  }

  await prisma.notification.createMany({
    data: due.map((c) => ({
      userId: c.userId,
      title: "Equipment overdue",
      body: `${c.asset.name} was due ${c.dueAt.toLocaleString()}. Please return or contact the lab.`,
    })),
  });

  if (isEmailConfigured()) {
    await Promise.allSettled(
      due.map((c) =>
        sendEmailResend({
          to: c.user.email,
          subject: `[Lab Nexus] Overdue: ${c.asset.name}`,
          text: `${c.asset.name} was due ${c.dueAt.toLocaleString()}. Please return or contact the lab.`,
          html: `<p>Hi${c.user.name ? ` ${escapeHtml(c.user.name)}` : ""},</p>
<p><strong>${escapeHtml(c.asset.name)}</strong> was due <strong>${escapeHtml(c.dueAt.toLocaleString())}</strong>.</p>
<p>Please return it or contact the lab.</p>
<p style="color:#666;font-size:12px">Lab Nexus — Vehicle Computing Lab</p>`,
        }),
      ),
    );
  }

  return due.length;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
