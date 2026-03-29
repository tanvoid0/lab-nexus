export type AssetListItem = {
  id: string;
  skuOrInternalId: string;
  name: string;
  conditionCode: string;
  operationalStatusCode: string;
  quantityTotal: number;
  quantityAvailable: number;
  categoryName: string | null;
  locationName: string | null;
  projectName: string | null;
  imagePath: string | null;
  acquiredAt: string | null;
  /** `/api/qr?...` when asset has a track tag and public app URL is configured */
  scanQrSrc: string | null;
  /** Count of active units; cart adds from the list require opening the asset to pick one. */
  trackedUnitCount: number;
};
