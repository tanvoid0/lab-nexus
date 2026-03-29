import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";

type Db = Prisma.TransactionClient | typeof prisma;

export type CartLineForValidation = {
  assetId: string;
  assetUnitId?: string | null;
  /** Effective project (line override or cart default). */
  projectId?: string | null;
};

/**
 * Ensures every cart line could be checked out at submit time (stock, units).
 * If a project id is present, verifies it still exists.
 */
export async function describeCartLinesBlocker(
  db: Db,
  lines: CartLineForValidation[],
  dueAt: Date,
): Promise<string | null> {
  if (Number.isNaN(dueAt.getTime())) return "Invalid due date.";
  if (dueAt.getTime() < Date.now()) return "Due date must be in the future.";

  const seenUnitKeys = new Set<string>();

  for (const line of lines) {
    const asset = await db.asset.findFirst({
      where: { id: line.assetId, ...notDeleted },
      include: {
        _count: {
          select: {
            units: { where: { ...notDeleted } },
          },
        },
      },
    });
    if (!asset) return "An item in your cart was removed from inventory.";
    if (asset.operationalStatusCode !== "AVAILABLE") {
      return `${asset.name} is not available for checkout.`;
    }
    if (asset.quantityAvailable < 1) {
      return `No units left for ${asset.name}.`;
    }

    const pid = line.projectId?.trim();
    if (pid) {
      const proj = await db.project.findFirst({
        where: { id: pid, ...notDeleted },
      });
      if (!proj) return "A selected project is no longer available.";
    }

    const unitCount = asset._count.units;
    if (unitCount > 0) {
      const uid = line.assetUnitId?.trim();
      if (!uid) return `${asset.name} requires choosing a specific unit.`;
      const unit = await db.assetUnit.findFirst({
        where: { id: uid, assetId: asset.id, ...notDeleted },
      });
      if (!unit) return `Invalid unit for ${asset.name}.`;
      const key = `${asset.id}:${unit.id}`;
      if (seenUnitKeys.has(key)) return `Duplicate unit for ${asset.name}.`;
      seenUnitKeys.add(key);
      const busy = await db.checkout.findFirst({
        where: {
          assetUnitId: unit.id,
          status: { in: ["ACTIVE", "OVERDUE"] },
        },
      });
      if (busy) return `A unit for ${asset.name} is already on loan.`;
    } else if (line.assetUnitId?.trim()) {
      return `${asset.name} does not use tracked units.`;
    }
  }

  return null;
}
