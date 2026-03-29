import { isValidIso4217Code } from "@/lib/currency/iso4217";
import { MAX_ADDITIONAL_TRANSACTION_CURRENCIES } from "@/lib/currency/constants";

/**
 * Parse comma / newline / semicolon separated currency codes from admin input.
 */
export function parseCurrencyCodesList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/g)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Normalize additional transaction codes: valid ISO 4217, deduped, functional excluded, sorted, capped.
 */
export function normalizeAdditionalTransactionCodes(
  functionalCurrencyCode: string,
  rawCodes: string[],
): string[] {
  const functional = functionalCurrencyCode.trim().toUpperCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of rawCodes.map((x) => x.trim().toUpperCase())) {
    if (!isValidIso4217Code(c)) continue;
    if (c === functional) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= MAX_ADDITIONAL_TRANSACTION_CURRENCIES) break;
  }
  return out.sort((a, b) => a.localeCompare(b));
}
