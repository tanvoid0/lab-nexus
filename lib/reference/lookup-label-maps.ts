import type { LookupDomain, PrismaClient } from "@prisma/client";

export type LookupLabelMaps = {
  conditionLabelByCode: Map<string, string>;
  operationalStatusLabelByCode: Map<string, string>;
};

export async function loadLookupLabelMaps(prisma: PrismaClient): Promise<LookupLabelMaps> {
  const rows = await prisma.lookupEntry.findMany({
    where: { deletedAt: null },
    orderBy: [{ domain: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
  });
  const conditionLabelByCode = new Map<string, string>();
  const operationalStatusLabelByCode = new Map<string, string>();
  for (const r of rows) {
    if (r.domain === "ASSET_CONDITION") {
      conditionLabelByCode.set(r.code, r.label);
    } else if (r.domain === "ASSET_OPERATIONAL_STATUS") {
      operationalStatusLabelByCode.set(r.code, r.label);
    }
  }
  return { conditionLabelByCode, operationalStatusLabelByCode };
}

export async function listActiveLookupsByDomain(
  prisma: PrismaClient,
  domain: LookupDomain,
) {
  return prisma.lookupEntry.findMany({
    where: { domain, isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });
}
