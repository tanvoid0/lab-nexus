export type CartLine = {
  assetId: string;
  /** Required when the asset has tracked units. */
  assetUnitId?: string;
  name: string;
  skuOrInternalId: string;
  /** Per-line project; omit to use cart default at checkout. */
  projectId?: string;
};
