import type { Asset, AssetCategory, Location } from "@prisma/client";
import type { AssetListItem } from "@/lib/types/dto";

type AssetWithRefs = Asset & {
  category: AssetCategory | null;
  location: Location | null;
};

export function toAssetListItem(a: AssetWithRefs): AssetListItem {
  return {
    id: a.id,
    skuOrInternalId: a.skuOrInternalId,
    name: a.name,
    condition: a.condition,
    operationalStatus: a.operationalStatus,
    quantityTotal: a.quantityTotal,
    quantityAvailable: a.quantityAvailable,
    categoryName: a.category?.name ?? null,
    locationName: a.location?.name ?? null,
    imagePath: a.imagePath,
    acquiredAt: a.acquiredAt?.toISOString() ?? null,
  };
}
