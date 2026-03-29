/**
 * Display formatting for monetary amounts. Pass **decimal** amounts (major units), not minor units.
 * For persisted money in new features, prefer storing decimals as strings (e.g. Decimal) to avoid float drift;
 * this helper is safe for UI when the value is already a bounded decimal.
 */
export function formatMonetaryAmount(
  amount: number,
  currencyCode: string,
  locale?: string,
): string {
  const code = currencyCode.trim().toUpperCase();
  try {
    return new Intl.NumberFormat(locale ?? undefined, {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

export function currencyFractionDigits(currencyCode: string): number {
  const code = currencyCode.trim().toUpperCase();
  try {
    const fmt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    });
    const opts = fmt.resolvedOptions();
    if (typeof opts.minimumFractionDigits === "number") {
      return opts.minimumFractionDigits;
    }
  } catch {
    /* fall through */
  }
  return 2;
}
