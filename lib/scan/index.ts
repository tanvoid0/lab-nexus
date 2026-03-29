/**
 * Scan / deep-link resolution helpers. Path decoding is generic; per-entity resolvers interpret payloads.
 * Routes under `app/(app)/scan/` compose these with redirects or UI.
 */
export {
  decodeScanPathSegment,
  decodedScanPayloadFromPathSegments,
} from "@/lib/scan/path-segments";
export { resolveInventoryTrackTagScan } from "@/lib/scan/inventory-track-tag";
export type {
  InventoryTrackTag,
  InventoryTrackTagScanResolution,
  ScanCatchAllPayload,
} from "@/lib/types/scan";
