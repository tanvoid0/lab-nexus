/** Escape a field for RFC 4180–style CSV (comma-separated, quoted if needed). */
export function escapeCsvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
