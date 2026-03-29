/**
 * Reusable QR building blocks: PNG generation, `/api/qr` href, and absolute URLs for the current host.
 * Entity-specific targets (e.g. inventory track tags) live in `lib/qr/*-target.ts` files.
 */
export { generateQrCodePngBuffer } from "@/lib/qr/generate-png";
export { QR_CODE_PNG_ROUTE_PATH, qrCodePngHrefForAbsoluteUrl } from "@/lib/qr/qr-png-route";
export { absoluteUrlForAppPath } from "@/lib/qr/absolute-app-url";
export {
  absoluteUrlForInventoryTrackTagScan,
  inventoryTrackTagQrPngHref,
} from "@/lib/qr/inventory-track-tag-target";
