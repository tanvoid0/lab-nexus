import type { AssetCondition, AssetOperationalStatus } from "@prisma/client";

/** Serializable row for inventory list / tables */
export type AssetListItem = {
  id: string;
  skuOrInternalId: string;
  name: string;
  condition: AssetCondition;
  operationalStatus: AssetOperationalStatus;
  quantityTotal: number;
  quantityAvailable: number;
  categoryName: string | null;
  locationName: string | null;
  imagePath: string | null;
  acquiredAt: string | null;
};
