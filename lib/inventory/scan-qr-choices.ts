import type { AssetUnitRow } from "@/lib/inventory/asset-unit";
import { unitLabel } from "@/lib/inventory/asset-unit";

/** One scannable track tag on the asset detail “Scan & QR” card (deduped by tag string). */
export type ScanQrChoiceModel = {
  trackTag: string;
  label: string;
  /**
   * When exactly one unit owns this tag (and the asset does not share it), deep links can target
   * that unit via `?unit=`. Otherwise null (asset-level only or shared / ambiguous tag).
   */
  unitId: string | null;
};

/**
 * Build ordered scan/QR targets: asset tag first (if any), then distinct unit tags in unit order.
 * Multiple units with the same tag collapse to one “group” row without a unit id.
 */
export function buildScanQrChoices(
  assetScanTag: string | null,
  unitRows: AssetUnitRow[],
): ScanQrChoiceModel[] {
  const assetTag = assetScanTag?.trim() || null;
  const choices: ScanQrChoiceModel[] = [];
  const seenTags = new Set<string>();

  const unitsWithTag = (tag: string) =>
    unitRows.filter((u) => (u.trackTag?.trim() || "") === tag);

  const recordTag = (tag: string) => {
    if (seenTags.has(tag)) return;
    seenTags.add(tag);

    const hasAsset = assetTag === tag;
    const units = unitsWithTag(tag);

    if (hasAsset && units.length === 0) {
      choices.push({ trackTag: tag, label: "Asset track tag", unitId: null });
      return;
    }
    if (!hasAsset && units.length === 1) {
      const u = units[0]!;
      choices.push({
        trackTag: tag,
        label: `Unit · ${unitLabel(u)}`,
        unitId: u.id,
      });
      return;
    }
    if (!hasAsset && units.length > 1) {
      choices.push({
        trackTag: tag,
        label: `Units · same tag (${units.length})`,
        unitId: null,
      });
      return;
    }
    choices.push({
      trackTag: tag,
      label:
        units.length === 1
          ? "Shared tag · asset + unit"
          : `Shared tag · asset + ${units.length} units`,
      unitId: null,
    });
  };

  if (assetTag) recordTag(assetTag);
  for (const u of unitRows) {
    const t = u.trackTag?.trim();
    if (t) recordTag(t);
  }

  return choices;
}

/** Pick dropdown index from `?unit=` when it matches a uniquely tagged unit row. */
export function initialScanQrChoiceIndex(
  choices: ScanQrChoiceModel[],
  unitQuery: string | null | undefined,
): number {
  const u = unitQuery?.trim();
  if (!u) return 0;
  const i = choices.findIndex((c) => c.unitId === u);
  return i >= 0 ? i : 0;
}
