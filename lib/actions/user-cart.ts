"use server";

import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { userCartPayloadSchema } from "@/lib/schemas/user-cart";

/**
 * Upsert the signed-in user's cart. Empty cart + no default project deletes the row.
 */
export async function syncUserCartAction(payload: unknown): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const parsed = userCartPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  const { lines, defaultProjectId } = parsed.data;
  const pid = defaultProjectId?.trim() || undefined;

  if (lines.length === 0 && !pid) {
    await prisma.userCart.deleteMany({ where: { userId: session.user.id } });
    return;
  }

  const linesJson = lines as unknown as Prisma.InputJsonValue;

  await prisma.userCart.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      lines: linesJson,
      defaultProjectId: pid,
    },
    update: {
      lines: linesJson,
      defaultProjectId: pid || null,
    },
  });
}

export async function clearUserCartForUserId(userId: string): Promise<void> {
  await prisma.userCart.deleteMany({ where: { userId } });
}
