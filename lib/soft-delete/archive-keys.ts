/** Suffix so archived documents free unique fields (SKU, slug, lookup code, track tags). */
export function archivedKeyFragment(id: string): string {
  return `__archived__${id}`;
}

/** Append archive suffix; truncates `value` if needed to stay within `maxLen`. */
export function appendArchivedSuffix(
  value: string,
  id: string,
  maxLen: number,
): string {
  const suffix = archivedKeyFragment(id);
  if (value.length + suffix.length <= maxLen) {
    return value + suffix;
  }
  const keep = Math.max(0, maxLen - suffix.length);
  return value.slice(0, keep) + suffix;
}
