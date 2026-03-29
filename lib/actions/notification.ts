"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

function revalidateNotificationSurfaces() {
  revalidatePath("/notifications");
  revalidatePath("/inventory", "layout");
}

export async function markNotificationRead(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = formData.get("notificationId");
  if (typeof id !== "string" || !id) return;

  const n = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!n || n.read) return;

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  revalidateNotificationSurfaces();
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidateNotificationSurfaces();
}
