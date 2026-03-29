import { absoluteUrlForAppPath } from "@/lib/qr/absolute-app-url";
import { qrCodePngHrefForAbsoluteUrl } from "@/lib/qr/qr-png-route";
import { scanPathForTrackTag } from "@/lib/nav/inventory-paths";
import type { InventoryTrackTag } from "@/lib/types/scan";

/**
 * Inventory-only: absolute URL that `/scan/...` expects for a `trackTag` (asset or unit).
 * Other domains should add sibling modules (e.g. `lib/qr/<entity>-target.ts`) using the same primitives.
 */
export async function absoluteUrlForInventoryTrackTagScan(
  trackTag: InventoryTrackTag | null | undefined,
): Promise<string | null> {
  const t = trackTag?.trim();
  if (!t) return null;
  return absoluteUrlForAppPath(scanPathForTrackTag(t));
}

/** `<img src>` href for a QR encoding `absoluteUrlForInventoryTrackTagScan`. */
export async function inventoryTrackTagQrPngHref(
  trackTag: InventoryTrackTag | null | undefined,
): Promise<string | null> {
  const target = await absoluteUrlForInventoryTrackTagScan(trackTag);
  if (!target) return null;
  return qrCodePngHrefForAbsoluteUrl(target);
}
