import type { ProjectUrlEntry } from "@/lib/schemas/project";

/** Best-effort parse of stored JSON link lists for display (ignores invalid rows). */
export function normalizeUrlEntries(raw: unknown): ProjectUrlEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ProjectUrlEntry[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!label || !url) continue;
    if (!URL.canParse(url)) continue;
    out.push({ label, url });
  }
  return out;
}
