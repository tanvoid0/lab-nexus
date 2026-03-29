/** Locale-aware absolute time for audit rows (clearer than default `Date#toLocaleString()`). */
export function formatAuditAbsolute(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const DAY_MS = 86_400_000;

/**
 * Short relative phrase for recent events; `null` if older than `maxDays` (show absolute only).
 */
export function formatAuditRelativePhrase(
  date: Date,
  now: Date,
  maxDays = 7,
): string | null {
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < 0) return null;
  if (elapsed >= maxDays * DAY_MS) return null;

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const sec = Math.floor(elapsed / 1000);
  if (sec < 45) return "just now";
  if (sec < 3600) {
    const m = Math.max(1, Math.floor(sec / 60));
    return rtf.format(-m, "minute");
  }
  if (elapsed < 24 * 3600 * 1000) {
    const h = Math.max(1, Math.floor(elapsed / (3600 * 1000)));
    return rtf.format(-h, "hour");
  }
  const d = Math.max(1, Math.floor(elapsed / DAY_MS));
  return rtf.format(-d, "day");
}
