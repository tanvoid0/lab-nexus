import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";

export type CreateSingleCheckoutInput = {
  userId: string;
  assetId: string;
  assetUnitId?: string | null;
  projectId?: string | null;
  purpose?: string | null;
  dueAt: Date;
  conditionOut?: Prisma.InputJsonValue | null;
};

export type CreateSingleCheckoutResult =
  | { ok: true; checkoutId: string }
  | { ok: false; formError: string; fieldErrors?: Record<string, string[]> };

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Creates one checkout and decrements asset availability. Caller should run inside a transaction when batching.
 */
export async function createSingleCheckout(
  db: Db,
  input: CreateSingleCheckoutInput,
): Promise<CreateSingleCheckoutResult> {
  const due = input.dueAt;
  if (Number.isNaN(due.getTime())) {
    return { ok: false, formError: "Invalid due date." };
  }
  if (due.getTime() < Date.now()) {
    return {
      ok: false,
      fieldErrors: { dueAt: ["Due date must be in the future"] },
      formError: "Due date must be in the future.",
    };
  }

  const asset = await db.asset.findFirst({
    where: { id: input.assetId, ...notDeleted },
    include: {
      _count: {
        select: {
          units: { where: { ...notDeleted } },
        },
      },
    },
  });
  if (!asset) return { ok: false, formError: "Asset not found." };
  if (asset.operationalStatusCode !== "AVAILABLE") {
    return { ok: false, formError: "Asset is not available for checkout." };
  }
  if (asset.quantityAvailable < 1) {
    return { ok: false, formError: "No units available." };
  }

  const pid = input.projectId?.trim();
  if (pid) {
    const proj = await db.project.findFirst({
      where: { id: pid, ...notDeleted },
    });
    if (!proj) {
      return { ok: false, formError: "That project is not available." };
    }
  }

  const unitCount = asset._count.units;
  let assetUnitId: string | undefined;

  if (unitCount > 0) {
    const uid = input.assetUnitId?.trim();
    if (!uid) {
      return {
        ok: false,
        fieldErrors: { assetUnitId: ["Select a serial / unit to check out."] },
        formError: "Select a unit.",
      };
    }
    const unit = await db.assetUnit.findFirst({
      where: { id: uid, assetId: asset.id, ...notDeleted },
    });
    if (!unit) {
      return {
        ok: false,
        fieldErrors: { assetUnitId: ["Invalid unit for this asset."] },
        formError: "Invalid unit.",
      };
    }
    const busy = await db.checkout.findFirst({
      where: {
        assetUnitId: unit.id,
        status: { in: ["ACTIVE", "OVERDUE"] },
      },
    });
    if (busy) {
      return {
        ok: false,
        fieldErrors: { assetUnitId: ["That unit is already on loan."] },
        formError: "Unit already on loan.",
      };
    }
    assetUnitId = unit.id;
  } else if (input.assetUnitId?.trim()) {
    return {
      ok: false,
      fieldErrors: { assetUnitId: ["This asset does not use tracked units."] },
      formError: "This asset does not use tracked units.",
    };
  }

  try {
    const checkout = await db.checkout.create({
      data: {
        userId: input.userId,
        assetId: asset.id,
        assetUnitId,
        projectId: pid || undefined,
        purpose: input.purpose?.trim() ? input.purpose.trim() : undefined,
        dueAt: due,
        conditionOut: input.conditionOut ?? undefined,
      },
    });
    await db.asset.update({
      where: { id: asset.id },
      data: { quantityAvailable: { decrement: 1 } },
    });
    return { ok: true, checkoutId: checkout.id };
  } catch (e) {
    return {
      ok: false,
      formError: e instanceof Error ? e.message : "Checkout failed.",
    };
  }
}
