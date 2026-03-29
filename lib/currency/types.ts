export type LabCurrencyConfigPublic = {
  functionalCurrencyCode: string;
  /** ISO 4217 codes allowed on vendor charges *in addition to* functional (functional is always allowed). */
  additionalTransactionCodes: string[];
  /** False when values come from env/bootstrap only (no `LabCurrencyConfig` row yet). */
  persisted: boolean;
};

export type LabCurrencyResolved = LabCurrencyConfigPublic & {
  /** Functional ∪ additional, sorted, unique — use for dropdowns and validation on procurement lines. */
  effectiveTransactionCurrencyCodes: string[];
};
