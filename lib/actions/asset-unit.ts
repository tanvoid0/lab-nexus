"use server";

import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { assetUnitCreateSchema } from "@/lib/schemas/asset-unit";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { appendArchivedSuffix } from "@/lib/soft-delete/archive-keys";
import { revalidatePath } from "next/cache";

export async function createAssetUnitAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const roles = session.user.roles ?? [];
  if (!hasAnyRole(roles, LAB_ROLES_STAFF)) {
    return failure({ formError: "You cannot add units." });
  }

  const raw = {
    assetId: formData.get("assetId"),
    serialNumber: (formData.get("serialNumber") as string) || undefined,
    imei: (formData.get("imei") as string) || undefined,
    trackTag: (formData.get("trackTag") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = assetUnitCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: parsed.data.assetId, ...notDeleted },
  });
  if (!asset) return failure({ formError: "Asset not found." });

  try {
    await prisma.$transaction([
      prisma.assetUnit.create({
        data: {
          assetId: asset.id,
          serialNumber: parsed.data.serialNumber?.trim() || undefined,
          imei: parsed.data.imei?.trim() || undefined,
          trackTag: parsed.data.trackTag?.trim() || undefined,
          notes: parsed.data.notes?.trim() || undefined,
        },
      }),
      prisma.asset.update({
        where: { id: asset.id },
        data: {
          quantityTotal: { increment: 1 },
          quantityAvailable: { increment: 1 },
        },
      }),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create unit.";
    if (msg.includes("Unique") || msg.includes("duplicate")) {
      return failure({ formError: "Track tag must be unique if set." });
    }
    return failure({ formError: msg });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Asset,
    entityId: asset.id,
    action: AuditAction.UNIT_CREATE,
    diff: { sku: asset.skuOrInternalId },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${asset.id}`);
  return { ok: true };
}

export async function deleteAssetUnitAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const roles = session.user.roles ?? [];
  if (!hasAnyRole(roles, LAB_ROLES_STAFF)) {
    return failure({ formError: "You cannot remove units." });
  }

  const unitId = formData.get("unitId");
  if (typeof unitId !== "string" || !unitId) {
    return failure({ formError: "Missing unit." });
  }

  const unit = await prisma.assetUnit.findFirst({
    where: { id: unitId, ...notDeleted },
    include: {
      checkouts: {
        where: { status: { in: ["ACTIVE", "OVERDUE"] } },
        take: 1,
      },
    },
  });
  if (!unit) return failure({ formError: "Unit not found." });
  if (unit.checkouts.length > 0) {
    return failure({ formError: "Cannot delete a unit that is checked out." });
  }

  const now = new Date();
  const newTag =
    unit.trackTag != null && unit.trackTag !== ""
      ? appendArchivedSuffix(unit.trackTag, unit.id, 200)
      : null;

  try {
    await prisma.$transaction([
      prisma.assetUnit.update({
        where: { id: unit.id },
        data: { deletedAt: now, trackTag: newTag },
      }),
      prisma.asset.update({
        where: { id: unit.assetId },
        data: {
          quantityTotal: { decrement: 1 },
          quantityAvailable: { decrement: 1 },
        },
      }),
    ]);
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Could not delete unit.",
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Asset,
    entityId: unit.assetId,
    action: AuditAction.UNIT_DELETE,
    diff: { unitId: unit.id },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${unit.assetId}`);
  return { ok: true };
}
