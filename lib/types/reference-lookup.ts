/** Mirrors Prisma `LookupEntry` (shared by admin reference UI and server pages). */
export type ReferenceLookupEntry = {
  id: string;
  domain: "ASSET_CONDITION" | "ASSET_OPERATIONAL_STATUS";
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  description: string | null;
};
