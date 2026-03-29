import type { LookupDomain } from "@prisma/client";

/** Seeded system lookup rows — stable `code` values for imports and APIs. */
export const DEFAULT_LOOKUP_ROWS: ReadonlyArray<{
  domain: LookupDomain;
  code: string;
  label: string;
  sortOrder: number;
  isSystem: boolean;
  description?: string;
}> = [
  {
    domain: "ASSET_CONDITION",
    code: "WORKING",
    label: "Working",
    sortOrder: 10,
    isSystem: true,
  },
  {
    domain: "ASSET_CONDITION",
    code: "BROKEN",
    label: "Broken",
    sortOrder: 20,
    isSystem: true,
  },
  {
    domain: "ASSET_CONDITION",
    code: "IN_REPAIR",
    label: "In repair",
    sortOrder: 30,
    isSystem: true,
  },
  {
    domain: "ASSET_CONDITION",
    code: "UNKNOWN",
    label: "Unknown",
    sortOrder: 40,
    isSystem: true,
  },
  {
    domain: "ASSET_OPERATIONAL_STATUS",
    code: "AVAILABLE",
    label: "Available",
    sortOrder: 10,
    isSystem: true,
  },
  {
    domain: "ASSET_OPERATIONAL_STATUS",
    code: "MAINTENANCE",
    label: "Maintenance",
    sortOrder: 20,
    isSystem: true,
  },
  {
    domain: "ASSET_OPERATIONAL_STATUS",
    code: "RETIRED",
    label: "Retired",
    sortOrder: 30,
    isSystem: true,
  },
];

export const DEFAULT_CONDITION_CODE = "UNKNOWN";
export const DEFAULT_OPERATIONAL_STATUS_CODE = "AVAILABLE";
