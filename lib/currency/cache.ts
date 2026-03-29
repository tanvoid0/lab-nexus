import { unstable_cache, updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { LAB_CURRENCY_CONFIG_ID } from "@/lib/currency/constants";
import { getBootstrapFunctionalCurrencyCode } from "@/lib/currency/bootstrap";
import { getIso4217Codes } from "@/lib/currency/iso4217";
import type { LabCurrencyResolved } from "@/lib/currency/types";
import { resolveLabCurrencyConfig } from "@/lib/currency/resolve";

export const labCurrencyConfigCacheTag = "lab-currency-config";

const REVALIDATE_SECONDS = 300;

async function loadLabCurrencyResolved(): Promise<LabCurrencyResolved> {
  const row = await prisma.labCurrencyConfig.findUnique({
    where: { id: LAB_CURRENCY_CONFIG_ID },
  });
  const bootstrap = getBootstrapFunctionalCurrencyCode();
  if (!row) {
    return resolveLabCurrencyConfig({
      functionalCurrencyCode: bootstrap,
      additionalTransactionCodes: [],
      persisted: false,
    });
  }
  const functional = row.functionalCurrencyCode.trim().toUpperCase();
  const codes = getIso4217Codes();
  const valid = new Set(codes);
  const functionalSanitized = valid.has(functional) ? functional : bootstrap;
  const rawAdditional: string[] = row.additionalTransactionCodes;
  const additional = rawAdditional
    .map((c: string) => c.trim().toUpperCase())
    .filter((c: string) => valid.has(c) && c !== functionalSanitized);
  const deduped: string[] = [...new Set(additional)].sort((a, b) =>
    a.localeCompare(b),
  );
  return resolveLabCurrencyConfig({
    functionalCurrencyCode: functionalSanitized,
    additionalTransactionCodes: deduped,
    persisted: true,
  });
}

export async function getCachedLabCurrencyConfig(): Promise<LabCurrencyResolved> {
  return unstable_cache(
    () => loadLabCurrencyResolved(),
    ["lab-currency-config", LAB_CURRENCY_CONFIG_ID],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [labCurrencyConfigCacheTag],
    },
  )();
}

export function revalidateLabCurrencyConfigCache(): void {
  updateTag(labCurrencyConfigCacheTag);
}
