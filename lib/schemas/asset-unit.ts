import { z } from "zod";

export const assetUnitCreateSchema = z.object({
  assetId: z.string().min(1),
  serialNumber: z.string().max(500).optional(),
  imei: z.string().max(64).optional(),
  trackTag: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export type AssetUnitCreateInput = z.infer<typeof assetUnitCreateSchema>;
