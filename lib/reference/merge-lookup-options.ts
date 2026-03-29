/**
 * Ensures the current asset code remains selectable when its lookup was deactivated.
 */
export function mergeLookupOptions(
  lookups: { code: string; label: string }[],
  currentCode: string | undefined,
): { code: string; label: string }[] {
  if (!currentCode) return lookups;
  if (lookups.some((c) => c.code === currentCode)) return lookups;
  return [...lookups, { code: currentCode, label: `${currentCode} (inactive)` }];
}
