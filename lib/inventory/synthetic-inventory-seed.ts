import { randomBytes } from "node:crypto";
import type { InventorySeedFile, InventorySeedItem } from "@/lib/schemas/inventory-seed";
import { buildSyntheticSeedImageUrl } from "@/lib/assets/image-upload";

const CATEGORIES = [
  "Robotics",
  "Networking",
  "Sensors",
  "Computers",
  "Peripherals & AV",
  "Storage",
  "Lab & field",
  "Simulation",
  "Optics & imaging",
  "Power & cabling",
  "Calibration fixtures",
] as const;

const LOCATION_PREFIXES = [
  "Bay",
  "Shelf",
  "Storage",
  "Bench",
  "Cabinet",
  "Staging",
  "Cold storage",
  "Loading dock",
  "High bay",
] as const;

const PRODUCT_STEMS = [
  "Evaluation kit",
  "Reference platform",
  "Sensor pack",
  "Compute node",
  "Dev board bundle",
  "RF module set",
  "Vision rig",
  "Telemetry node",
  "Drive-by-wire kit",
  "Bench power unit",
  "GNSS timing receiver",
  "IMU characterization stack",
  "Spectrum analyzer front-end",
  "Motor driver eval board",
  "LiDAR alignment jig",
  "Edge inference box",
] as const;

/** Deterministic pseudo-random for CI / reproducible seeds (xorshift32). */
function makeRng(seed: number): () => number {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffff_ffff;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function isoDaysAgo(rng: () => number, maxDays: number): string {
  const days = 30 + Math.floor(rng() * maxDays);
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toISOString();
}

export type SyntheticInventorySeedOptions = {
  itemCount: number;
  /** When true (e.g. CI), same catalog every run. */
  deterministic: boolean;
};

/**
 * Generates plausible, **non-proprietary** inventory rows for `pnpm db:seed`.
 * No real names, sites, or procurement notes.
 */
export function buildSyntheticInventorySeed(
  options: SyntheticInventorySeedOptions,
): InventorySeedFile {
  const { itemCount, deterministic } = options;
  const rng = deterministic
    ? makeRng(0x4c_ab_6e_75)
    : makeRng(randomBytes(4).readUInt32BE(0));

  const items: InventorySeedItem[] = [];
  for (let i = 0; i < itemCount; i += 1) {
    const idx = i + 1;
    const cat = pick(rng, CATEGORIES);
    const locPrefix = pick(rng, LOCATION_PREFIXES);
    const locNum = 1 + Math.floor(rng() * 12);
    const stem = pick(rng, PRODUCT_STEMS);
    const variant = `${String.fromCharCode(65 + (i % 26))}${1 + (i % 9)}`;

    const sku = `SYN-INV-${String(idx).padStart(3, "0")}`;
    const cohort = Math.floor((idx - 1) / 10);
    const name =
      cohort > 0
        ? `${stem} (${variant}, batch ${cohort + 1})`
        : `${stem} (${variant})`;

    const row: InventorySeedItem = {
      sku,
      name,
      qty: 1 + Math.floor(rng() * 6),
      location: `${locPrefix} ${locNum}`,
      category: cat,
      notes:
        idx % 5 === 0
          ? "Synthetic seed row — replace with your lab data via import or admin."
          : idx % 8 === 3
            ? "Label outer bin; spare cables in nested tray."
            : undefined,
      quoteUrl: idx % 7 === 0 ? "https://example.com/product-placeholder" : undefined,
      imageUrl: buildSyntheticSeedImageUrl(`${sku}-${Math.floor(rng() * 10_000)}`),
    };

    if (idx % 6 !== 1) {
      row.acquiredAt = isoDaysAgo(rng, 920);
    }

    const mod13 = idx % 13;
    if (mod13 === 0) row.condition = "BROKEN";
    else if (mod13 === 3) row.condition = "In repair";
    else if (mod13 === 6) row.condition = "UNKNOWN";

    const mod11 = idx % 11;
    if (mod11 === 2) row.operationalStatus = "Maintenance";
    else if (mod11 === 5) row.operationalStatus = "RETIRED";

    items.push(row);
  }

  return { version: 1, items };
}
