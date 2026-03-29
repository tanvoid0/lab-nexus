export function formatAuditDiffPreview(diff: unknown, maxLen = 220): string {
  if (diff == null) return "—";
  try {
    const s = JSON.stringify(diff);
    return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
  } catch {
    return "…";
  }
}
