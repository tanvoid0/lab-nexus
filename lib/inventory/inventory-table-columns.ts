export const INVENTORY_OPTIONAL_COLUMNS_STORAGE_KEY =
  "lab-nexus-inventory-optional-columns-v1";

export const INVENTORY_OPTIONAL_COLUMN_IDS = [
  "category",
  "location",
  "project",
  "qty",
  "scanQr",
  "condition",
  "status",
] as const;

export type InventoryOptionalColumnId =
  (typeof INVENTORY_OPTIONAL_COLUMN_IDS)[number];

export const INVENTORY_OPTIONAL_COLUMN_LABELS: Record<
  InventoryOptionalColumnId,
  string
> = {
  category: "Category",
  location: "Location",
  project: "Project",
  qty: "Quantity",
  scanQr: "Scan QR",
  condition: "Condition",
  status: "Operational status",
};

export const DEFAULT_OPTIONAL_COLUMN_VISIBILITY: Record<
  InventoryOptionalColumnId,
  boolean
> = {
  category: true,
  location: true,
  project: true,
  qty: true,
  scanQr: true,
  condition: true,
  status: true,
};

export function mergeOptionalColumnVisibility(
  raw: unknown,
): Record<InventoryOptionalColumnId, boolean> {
  const out = { ...DEFAULT_OPTIONAL_COLUMN_VISIBILITY };
  if (!raw || typeof raw !== "object") return out;
  const o = raw as Record<string, unknown>;
  for (const id of INVENTORY_OPTIONAL_COLUMN_IDS) {
    const v = o[id];
    if (typeof v === "boolean") out[id] = v;
  }
  return out;
}

export function readStoredOptionalColumnVisibility(): Record<
  InventoryOptionalColumnId,
  boolean
> {
  if (typeof window === "undefined") {
    return { ...DEFAULT_OPTIONAL_COLUMN_VISIBILITY };
  }
  try {
    const s = window.localStorage.getItem(
      INVENTORY_OPTIONAL_COLUMNS_STORAGE_KEY,
    );
    if (!s) return { ...DEFAULT_OPTIONAL_COLUMN_VISIBILITY };
    return mergeOptionalColumnVisibility(JSON.parse(s) as unknown);
  } catch {
    return { ...DEFAULT_OPTIONAL_COLUMN_VISIBILITY };
  }
}

export function writeStoredOptionalColumnVisibility(
  v: Record<InventoryOptionalColumnId, boolean>,
) {
  try {
    window.localStorage.setItem(
      INVENTORY_OPTIONAL_COLUMNS_STORAGE_KEY,
      JSON.stringify(v),
    );
  } catch {
    /* ignore */
  }
}
