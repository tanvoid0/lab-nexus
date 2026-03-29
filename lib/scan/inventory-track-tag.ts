import type { PrismaClient } from "@prisma/client";
import { notDeleted } from "@/lib/prisma/active-scopes";
import type {
  InventoryTrackTag,
  InventoryTrackTagScanResolution,
} from "@/lib/types/scan";

/**
 * Resolve `/scan/...` payload as an inventory **track tag** (asset or unit). Other entity types
 * can add `lib/scan/<entity>.ts` plus route structure when needed.
 */
export async function resolveInventoryTrackTagScan(
  prisma: PrismaClient,
  tag: InventoryTrackTag,
): Promise<InventoryTrackTagScanResolution> {
  const normalized = tag.trim();
  if (!normalized) {
    return { kind: "none", tag: "" };
  }

  const [assetMatch, unitMatch] = await Promise.all([
    prisma.asset.findFirst({
      where: { trackTag: normalized, ...notDeleted },
      select: { id: true },
    }),
    prisma.assetUnit.findFirst({
      where: { trackTag: normalized, ...notDeleted },
      select: { id: true, assetId: true },
    }),
  ]);

  const candidateIds = new Set<string>();
  if (assetMatch) candidateIds.add(assetMatch.id);
  if (unitMatch) candidateIds.add(unitMatch.assetId);

  if (candidateIds.size === 0) {
    return { kind: "none", tag: normalized };
  }

  const existing = await prisma.asset.findMany({
    where: { id: { in: [...candidateIds] }, ...notDeleted },
    select: { id: true },
  });

  if (existing.length === 0) {
    return { kind: "none", tag: normalized };
  }
  if (existing.length === 1) {
    const assetId = existing[0]!.id;
    if (unitMatch && unitMatch.assetId === assetId) {
      return { kind: "ok", assetId, unitId: unitMatch.id };
    }
    return { kind: "ok", assetId };
  }

  return {
    kind: "ambiguous",
    tag: normalized,
    assetIds: existing.map((a) => a.id),
  };
}
