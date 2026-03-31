import type { DensityPreference } from "@/lib/settings/types";

export const DENSITY_STORAGE_KEY = "vehicle-computing-lab-density";

export type { DensityPreference };

export function readDensityPreference(): DensityPreference {
  if (typeof window === "undefined") return "comfortable";
  try {
    const v = window.localStorage.getItem(DENSITY_STORAGE_KEY);
    return v === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function writeDensityPreference(value: DensityPreference) {
  try {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle(
    "density-compact",
    value === "compact",
  );
}

/** Apply density class from localStorage without writing (hydration / startup). */
export function applyStoredDensityClass() {
  const v = readDensityPreference();
  document.documentElement.classList.toggle("density-compact", v === "compact");
}
