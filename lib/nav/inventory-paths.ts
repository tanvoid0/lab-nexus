import type { InventoryTrackTag } from "@/lib/types/scan";

/**
 * Canonical path builders for inventory list, asset detail, and `/scan/...` deep links.
 * Scan uses a catch‑all route so tags that contain `/` (or scanners that split on `/`)
 * still resolve; always build scan URLs through `scanPathForTrackTag`.
 */
export const INVENTORY_LIST_PATH = "/inventory" as const;

export function assetDetailPath(
  assetId: string,
  options?: { unit?: string | null },
): string {
  const id = assetId.trim();
  if (!id) {
    throw new Error("assetDetailPath: missing asset id");
  }
  const base = `${INVENTORY_LIST_PATH}/${id}`;
  const u = options?.unit?.trim();
  if (!u) return base;
  return `${base}?unit=${encodeURIComponent(u)}`;
}

/**
 * Build `/scan/...` for a stored `trackTag`. Tags may include `/`; each segment is encoded separately.
 */
export function scanPathForTrackTag(trackTag: InventoryTrackTag): string {
  const raw = trackTag.trim();
  if (!raw) {
    throw new Error("scanPathForTrackTag: empty tag");
  }
  const parts = raw
    .split("/")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    throw new Error("scanPathForTrackTag: invalid tag");
  }
  if (parts.length > 24) {
    throw new Error("scanPathForTrackTag: too many path segments");
  }
  return `/scan/${parts.map((p) => encodeURIComponent(p)).join("/")}`;
}
