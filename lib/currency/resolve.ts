import type { LabCurrencyConfigPublic, LabCurrencyResolved } from "@/lib/currency/types";

export function effectiveTransactionCurrencyCodes(
  config: LabCurrencyConfigPublic,
): string[] {
  const functional = config.functionalCurrencyCode.trim().toUpperCase();
  const set = new Set<string>([functional]);
  for (const c of config.additionalTransactionCodes) {
    set.add(c.trim().toUpperCase());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function resolveLabCurrencyConfig(row: LabCurrencyConfigPublic): LabCurrencyResolved {
  return {
    ...row,
    effectiveTransactionCurrencyCodes: effectiveTransactionCurrencyCodes(row),
  };
}

/**
 * Returns true if `code` may appear on a stored vendor charge / invoice line for this lab.
 * Functional currency is always permitted.
 */
export function isAllowedTransactionCurrency(
  code: string,
  resolved: LabCurrencyResolved,
): boolean {
  const c = code.trim().toUpperCase();
  return resolved.effectiveTransactionCurrencyCodes.includes(c);
}
