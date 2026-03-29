import { z } from "zod";

/** Full line shape stored in DB and synced from the client cart. */
export const persistedCartLineSchema = z.object({
  assetId: z.string().min(1),
  assetUnitId: z.string().optional(),
  projectId: z.string().optional(),
  name: z.string().min(1),
  skuOrInternalId: z.string().min(1),
});

export const userCartPayloadSchema = z.object({
  lines: z.array(persistedCartLineSchema).max(40),
  defaultProjectId: z.string().optional().nullable(),
});

export type UserCartPayload = z.infer<typeof userCartPayloadSchema>;
