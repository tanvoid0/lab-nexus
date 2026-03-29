/**
 * Scan deep-link domain types. Resolvers live under `lib/scan/`; keep pure types here so routes,
 * QR builders, and tests can share them without importing Prisma.
 */

/** Stored or scanned inventory track tag (may contain `/`). */
export type InventoryTrackTag = string;

/**
 * Logical payload after joining catch-all `/scan/[[...tag]]` segments. Interpretation is
 * entity-specific (e.g. inventory treats it as {@link InventoryTrackTag}).
 */
export type ScanCatchAllPayload = string;

/**
 * Result of resolving a scan payload as an inventory track tag (asset-level or unit-level).
 * Extend with new `kind` variants when additional scan domains are added.
 */
export type InventoryTrackTagScanResolution =
  | { kind: "ok"; assetId: string; unitId?: string }
  | { kind: "ambiguous"; tag: InventoryTrackTag; assetIds: string[] }
  | { kind: "none"; tag: InventoryTrackTag };
