import { z } from "zod";
import { checkoutPurposeField } from "@/lib/schemas/checkout";

export const cartLineSchema = z.object({
  assetId: z.string().min(1),
  assetUnitId: z.string().optional(),
  projectId: z.string().optional(),
});

export const cartSubmitSchema = z.object({
  lines: z.array(cartLineSchema).min(1, "Add at least one item.").max(40),
  defaultProjectId: z.string().optional(),
  purpose: checkoutPurposeField,
  dueAt: z.string().min(1, "Due date is required"),
  conditionNote: z.string().max(2000).optional(),
});

export type CartSubmitInput = z.infer<typeof cartSubmitSchema>;
