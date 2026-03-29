import { z } from "zod";

export const checkoutCreateSchema = z.object({
  assetId: z.string().min(1),
  assetUnitId: z.string().optional(),
  projectId: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required").max(2000),
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
