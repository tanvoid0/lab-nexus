import { z } from "zod";

/** Trimmed text, or `undefined` if missing / blank — matches optional `Checkout.purpose`. */
export const checkoutPurposeField = z.preprocess((val) => {
  if (val == null) return undefined;
  const t = String(val).trim();
  return t.length > 0 ? t : undefined;
}, z.string().max(2000).optional());

export const checkoutCreateSchema = z.object({
  assetId: z.string().min(1),
  assetUnitId: z.string().optional(),
  projectId: z.string().optional(),
  purpose: checkoutPurposeField,
  dueAt: z.string().min(1, "Due date is required"),
  conditionNote: z.string().max(2000).optional(),
});

export const checkoutReturnSchema = z.object({
  checkoutId: z.string().min(1),
  conditionNote: z.string().max(2000).optional(),
  damageReport: z.string().max(5000).optional(),
});

export type CheckoutCreateInput = z.infer<typeof checkoutCreateSchema>;
export type CheckoutReturnInput = z.infer<typeof checkoutReturnSchema>;
