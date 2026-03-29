import type { LookupDomain, PrismaClient } from "@prisma/client";

export class LookupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LookupValidationError";
  }
}

export async function requireActiveLookupCode(
  prisma: PrismaClient,
  domain: LookupDomain,
  code: string,
): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new LookupValidationError("Lookup code is required.");
  }
  const row = await prisma.lookupEntry.findFirst({
    where: { domain, code: trimmed, deletedAt: null },
  });
  if (!row || !row.isActive) {
    throw new LookupValidationError(
      `Invalid or inactive ${domain.replaceAll("_", " ").toLowerCase()}: ${trimmed}`,
    );
  }
}

/** Resolve seed/import string to an active lookup code (by code or case-insensitive label). */
export async function resolveLookupCode(
  prisma: PrismaClient,
  domain: LookupDomain,
  raw: string | undefined,
  fallbackCode: string,
): Promise<string> {
  if (raw == null || raw.trim() === "") return fallbackCode;
  const t = raw.trim();
  const byCode = await prisma.lookupEntry.findFirst({
    where: { domain, code: t, deletedAt: null },
  });
  if (byCode?.isActive) return byCode.code;
  const all = await prisma.lookupEntry.findMany({
    where: { domain, isActive: true, deletedAt: null },
  });
  const lower = t.toLowerCase();
  const byLabel = all.find((e) => e.label.toLowerCase() === lower);
  if (byLabel) return byLabel.code;
  return fallbackCode;
}
