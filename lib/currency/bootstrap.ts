import { isValidIso4217Code } from "@/lib/currency/iso4217";

const DEFAULT_FUNCTIONAL = "USD";

/**
 * Default functional (base) currency when no DB row exists yet.
 * Set `LAB_FUNCTIONAL_CURRENCY` for first deploy / empty DB (must be ISO 4217).
 */
export function getBootstrapFunctionalCurrencyCode(): string {
  const raw = process.env.LAB_FUNCTIONAL_CURRENCY?.trim().toUpperCase();
  if (raw && isValidIso4217Code(raw)) return raw;
  return DEFAULT_FUNCTIONAL;
}
