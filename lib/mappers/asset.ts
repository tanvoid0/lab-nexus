import type { Asset, AssetCategory, Location, Project } from "@prisma/client";
import { inventoryTrackTagQrPngHref } from "@/lib/qr/inventory-track-tag-target";
import type { AssetListItem } from "@/lib/types/dto";

type AssetWithRefs = Asset & {
  category: AssetCategory | null;
  location: Location | null;
  project: Project | null;
  _count?: { units: number };
};

export async function toAssetListItem(a: AssetWithRefs): Promise<AssetListItem> {
  return {
    id: a.id,
    skuOrInternalId: a.skuOrInternalId,
    name: a.name,
    conditionCode: a.conditionCode,
    operationalStatusCode: a.operationalStatusCode,
    quantityTotal: a.quantityTotal,
    quantityAvailable: a.quantityAvailable,
    categoryName: a.category?.name ?? null,
    locationName: a.location?.name ?? null,
    projectName: a.project?.name ?? null,
    imagePath: a.imagePath,
    acquiredAt: a.acquiredAt?.toISOString() ?? null,
    scanQrSrc: await inventoryTrackTagQrPngHref(a.trackTag),
    trackedUnitCount: a._count?.units ?? 0,
  };
}
