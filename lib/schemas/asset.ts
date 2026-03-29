import { z } from "zod";

export const assetConditionSchema = z.enum([
  "WORKING",
  "BROKEN",
  "IN_REPAIR",
  "UNKNOWN",
]);

export const assetOperationalStatusSchema = z.enum([
  "AVAILABLE",
  "MAINTENANCE",
  "RETIRED",
]);

export const assetCreateSchema = z.object({
  skuOrInternalId: z.string().min(1, "SKU / ID is required").max(200),
  name: z.string().min(1, "Name is required").max(500),
  specs: z.string().optional(),
  condition: assetConditionSchema.default("UNKNOWN"),
  operationalStatus: assetOperationalStatusSchema.default("AVAILABLE"),
  quantityTotal: z.coerce.number().int().min(1).default(1),
  quantityAvailable: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(10000).optional(),
  quoteUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  locationId: z.string().optional(),
  custodianUserId: z.string().optional(),
  acquiredAt: z.string().optional(),
  trackTag: z.string().max(200).optional(),
});

export const assetUpdateSchema = assetCreateSchema.extend({
  id: z.string().min(1),
});

export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
