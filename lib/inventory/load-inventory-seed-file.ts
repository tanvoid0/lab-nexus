import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type InventorySeedFile,
  inventorySeedFileSchema,
} from "@/lib/schemas/inventory-seed";
import { buildSyntheticInventorySeed } from "./synthetic-inventory-seed";

export type { InventorySeedFile };

/** Default optional JSON: `prisma/data/inventory-seed.json` under the repo root. */
export const DEFAULT_INVENTORY_SEED_JSON = join(
  /* turbopackIgnore: true */ process.cwd(),
  "prisma",
  "data",
  "inventory-seed.json",
);

function loadInventorySeedFromPath(jsonPath: string): InventorySeedFile {
  const raw = readFileSync(/* turbopackIgnore: true */ jsonPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return inventorySeedFileSchema.parse(parsed);
}

/**
 * Loads spreadsheet-style inventory rows for seeding.
 * - If `INVENTORY_SEED_JSON` is set and the file exists, that file wins.
 * - Else if `prisma/data/inventory-seed.json` exists, it is used.
 * - Otherwise generates synthetic placeholder items (randomized locally, fixed in CI).
 */
export function loadInventorySeedFile(explicitPath?: string): InventorySeedFile {
  const fromEnv = process.env.INVENTORY_SEED_JSON?.trim();
  const fallbackPath = explicitPath ?? fromEnv ?? DEFAULT_INVENTORY_SEED_JSON;

  if (fallbackPath && existsSync(/* turbopackIgnore: true */ fallbackPath)) {
    return loadInventorySeedFromPath(fallbackPath);
  }

  const deterministic = process.env.CI === "true";
  const countRaw = process.env.INVENTORY_SEED_ITEM_COUNT?.trim();
  const parsedCount = countRaw ? Number.parseInt(countRaw, 10) : Number.NaN;
  const itemCount = Number.isFinite(parsedCount)
    ? Math.max(1, Math.min(500, parsedCount))
    : 42;

  return buildSyntheticInventorySeed({ itemCount, deterministic });
}
