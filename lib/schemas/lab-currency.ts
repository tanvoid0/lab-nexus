import { z } from "zod";
import { isValidIso4217Code } from "@/lib/currency/iso4217";

export const labCurrencyConfigFormSchema = z.object({
  functionalCurrencyCode: z
    .string()
    .trim()
    .min(3)
    .max(3)
    .transform((s) => s.toUpperCase())
    .refine(isValidIso4217Code, "Unknown ISO 4217 currency code."),
  additionalTransactionCodesRaw: z.string().max(2000).optional().default(""),
});

export type LabCurrencyConfigFormInput = z.infer<typeof labCurrencyConfigFormSchema>;
