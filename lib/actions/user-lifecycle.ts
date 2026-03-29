"use server";

import { auth } from "@/auth";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { notDeleted } from "@/lib/prisma/active-scopes";

function parseUserId(formData: FormData): string | null {
  const v = formData.get("userId");
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Deactivate a lab account (soft delete). Rows stay for audit and checkout history. ADMIN only. */
export async function deactivateLabUserAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !hasRole(session.user.roles ?? [], LAB_ROLE.ADMIN)) {
    redirect("/inventory");
  }

  const targetId = parseUserId(formData);
  if (!targetId) redirect("/admin/users?err=invalid");

  if (targetId === session.user.id) {
    redirect("/admin/users?err=self");
  }

  const user = await prisma.user.findFirst({
    where: { id: targetId, ...notDeleted },
  });
  if (!user) redirect("/admin/users?err=missing");

  await prisma.user.update({
    where: { id: targetId },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.User,
    entityId: targetId,
    action: AuditAction.UPDATE,
    diff: { email: user.email, deactivated: true },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users");
}

/** Restore a deactivated lab account. ADMIN only. */
export async function restoreLabUserAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !hasRole(session.user.roles ?? [], LAB_ROLE.ADMIN)) {
    redirect("/inventory");
  }

  const targetId = parseUserId(formData);
  if (!targetId) redirect("/admin/users?err=invalid");

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user || !user.deletedAt) redirect("/admin/users?err=missing");

  await prisma.user.update({
    where: { id: targetId },
    data: { deletedAt: null },
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.User,
    entityId: targetId,
    action: AuditAction.UPDATE,
    diff: { email: user.email, restored: true },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users");
}
