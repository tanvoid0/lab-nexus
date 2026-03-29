import type { PrismaClient } from "@prisma/client";
import { DEFAULT_LOOKUP_ROWS } from "@/lib/reference/lookup-defaults";

/** Idempotent: upserts seeded lookup rows by domain+code. */
export async function ensureDefaultLookupEntries(prisma: PrismaClient): Promise<void> {
  for (const row of DEFAULT_LOOKUP_ROWS) {
    await prisma.lookupEntry.upsert({
      where: {
        domain_code: { domain: row.domain, code: row.code },
      },
      create: {
        domain: row.domain,
        code: row.code,
        label: row.label,
        sortOrder: row.sortOrder,
        isActive: true,
        isSystem: row.isSystem,
        description: row.description,
      },
      update: {
        label: row.label,
        sortOrder: row.sortOrder,
        isSystem: row.isSystem,
        description: row.description ?? undefined,
      },
    });
  }
}
