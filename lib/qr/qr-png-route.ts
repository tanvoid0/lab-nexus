/** Next route path (no query). */
export const QR_CODE_PNG_ROUTE_PATH = "/api/qr" as const;

/**
 * Relative `href` for `<img src>` that hits the QR PNG API. `absoluteUrl` must already be a full
 * `https://…` string suitable for phone cameras (see `absoluteUrlForAppPath`).
 */
export function qrCodePngHrefForAbsoluteUrl(absoluteUrl: string): string {
  return `${QR_CODE_PNG_ROUTE_PATH}?url=${encodeURIComponent(absoluteUrl)}`;
}
