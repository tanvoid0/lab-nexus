import type { ScanCatchAllPayload } from "@/lib/types/scan";

/**
 * Decode URL path segments for catch-all scan (or similar) routes. Entity-agnostic; pair with a
 * resolver that interprets the decoded string (e.g. inventory track tag).
 */
export function decodeScanPathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Join catch-all segments back into one logical value (e.g. tag that may contain `/`). */
export function decodedScanPayloadFromPathSegments(
  segments: string[],
): ScanCatchAllPayload {
  return segments.map(decodeScanPathSegment).join("/").trim();
}
