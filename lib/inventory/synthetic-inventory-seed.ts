import { randomBytes } from "node:crypto";
import type { InventorySeedFile, InventorySeedItem } from "@/lib/schemas/inventory-seed";

const CATEGORIES = [
  "Robotics",
  "Networking",
  "Sensors",
  "Computers",
  "Peripherals & AV",
  "Storage",
  "Lab & field",
  "Simulation",
] as const;

const LOCATION_PREFIXES = [
  "Bay",
  "Shelf",
  "Storage",
  "Bench",
  "Cabinet",
  "Staging",
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
    const name = `${stem} (${variant})`;

    const row: InventorySeedItem = {
      sku,
      name,
      qty: 1 + Math.floor(rng() * 3),
      location: `${locPrefix} ${locNum}`,
      category: cat,
      acquiredAt: isoDaysAgo(rng, 800),
      notes:
        idx % 5 === 0
          ? "Synthetic seed row — replace with your lab data via import or admin."
          : undefined,
      quoteUrl: idx % 7 === 0 ? "https://example.com/product-placeholder" : undefined,
    };

    if (idx === 4) {
      row.condition = "BROKEN";
    } else if (idx === 11) {
      row.operationalStatus = "Maintenance";
    }

    items.push(row);
  }

  return { version: 1, items };
}
