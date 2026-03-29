import type { PrismaClient } from "@prisma/client";
import { notDeleted } from "../prisma/active-scopes";

export type TrackTagScanResolution =
  | { kind: "ok"; assetId: string }
  | { kind: "ambiguous"; tag: string; assetIds: string[] }
  | { kind: "none"; tag: string };

/** Decode one URL path segment; avoid throwing on malformed `%` (see scan route). */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Rebuild the track tag string from catch‑all route segments (already split on `/`).
 */
export function trackTagFromScanSegments(segments: string[]): string {
  return segments.map(decodeSegment).join("/").trim();
}

/**
 * Resolve a scanned / bookmarked tag to a catalog asset. Uses `findUnique` on `trackTag`.
 * Verifies the asset row still exists (stale unit rows).
 */
export async function resolveTrackTagScan(
  prisma: PrismaClient,
  tag: string,
): Promise<TrackTagScanResolution> {
  const normalized = tag.trim();
  if (!normalized) {
    return { kind: "none", tag: "" };
  }

  const [assetMatch, unitMatch] = await Promise.all([
    prisma.asset.findFirst({
      where: { trackTag: normalized, ...notDeleted },
      select: { id: true },
    }),
    prisma.assetUnit.findFirst({
      where: { trackTag: normalized, ...notDeleted },
      select: { assetId: true },
    }),
  ]);

  const candidateIds = new Set<string>();
  if (assetMatch) candidateIds.add(assetMatch.id);
  if (unitMatch) candidateIds.add(unitMatch.assetId);

  if (candidateIds.size === 0) {
    return { kind: "none", tag: normalized };
  }

  const existing = await prisma.asset.findMany({
    where: { id: { in: [...candidateIds] }, ...notDeleted },
    select: { id: true },
  });

  if (existing.length === 0) {
    return { kind: "none", tag: normalized };
  }
  if (existing.length === 1) {
    return { kind: "ok", assetId: existing[0]!.id };
  }

  return {
    kind: "ambiguous",
    tag: normalized,
    assetIds: existing.map((a) => a.id),
  };
}
