/**
 * ISO 4217 alphabetic codes via the runtime ICU list (Node / modern browsers).
 * Prefer this over a hand-maintained table so validation tracks platform currency support.
 */
const FALLBACK_CODES = [
  "AUD",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "EUR",
  "GBP",
  "HKD",
  "INR",
  "JPY",
  "KRW",
  "MXN",
  "NOK",
  "NZD",
  "SEK",
  "SGD",
  "USD",
  "ZAR",
] as const;

let cachedSorted: readonly string[] | null = null;

function loadSortedCodes(): readonly string[] {
  if (cachedSorted) return cachedSorted;
  try {
    const intl = Intl as unknown as {
      supportedValuesOf?: (key: "currency") => string[];
    };
    if (typeof intl.supportedValuesOf === "function") {
      const list = intl.supportedValuesOf("currency");
      cachedSorted = Object.freeze([...new Set(list)].sort((a, b) => a.localeCompare(b)));
      return cachedSorted;
    }
  } catch {
    /* use fallback */
  }
  cachedSorted = Object.freeze([...FALLBACK_CODES]);
  return cachedSorted;
}

/** Sorted ISO 4217 codes available in this runtime (typically ~150+). */
export function getIso4217Codes(): readonly string[] {
  return loadSortedCodes();
}

export function isValidIso4217Code(code: string): boolean {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) return false;
  return new Set(loadSortedCodes()).has(c);
}
