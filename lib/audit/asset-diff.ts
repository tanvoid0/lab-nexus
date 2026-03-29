type AssetAuditFields = {
  skuOrInternalId: string;
  name: string;
  specs: unknown;
  conditionCode: string;
  operationalStatusCode: string;
  quantityTotal: number;
  quantityAvailable: number;
  notes: string | null;
  quoteUrl: string | null;
  categoryId: string | null;
  locationId: string | null;
  projectId: string | null;
  custodianUserId: string | null;
  acquiredAt: Date | null;
  trackTag: string | null;
  imagePath: string | null;
};

export function assetAuditSnapshot(asset: AssetAuditFields): Record<string, unknown> {
  return {
    skuOrInternalId: asset.skuOrInternalId,
    name: asset.name,
    specs: asset.specs,
    conditionCode: asset.conditionCode,
    operationalStatusCode: asset.operationalStatusCode,
    quantityTotal: asset.quantityTotal,
    quantityAvailable: asset.quantityAvailable,
    notes: asset.notes,
    quoteUrl: asset.quoteUrl,
    categoryId: asset.categoryId,
    locationId: asset.locationId,
    projectId: asset.projectId,
    custodianUserId: asset.custodianUserId,
    acquiredAt: asset.acquiredAt?.toISOString() ?? null,
    trackTag: asset.trackTag,
    imagePath: asset.imagePath,
  };
}

export function changedFieldDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> | undefined {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      out[key] = { from: b, to: a };
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
