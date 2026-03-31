import { z } from "zod";

export const inventorySeedItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  qty: z.number().int().min(1),
  location: z.string().min(1),
  category: z.string().min(1),
  acquiredAt: z.union([z.string().min(1), z.null()]).optional(),
  notes: z.union([z.string(), z.null()]).optional(),
  quoteUrl: z.union([z.string(), z.null()]).optional(),
  imageUrl: z.union([z.string().url(), z.null()]).optional(),
  /** Resolved against lookup table by code or label (case-insensitive). */
  condition: z.string().optional(),
  operationalStatus: z.string().optional(),
});

export const inventorySeedFileSchema = z.object({
  version: z.number().int().optional(),
  items: z.array(inventorySeedItemSchema),
});

export const inventorySeedRequestSchema = z.object({
  items: z.array(inventorySeedItemSchema),
});

export type InventorySeedItem = z.infer<typeof inventorySeedItemSchema>;
export type InventorySeedFile = z.infer<typeof inventorySeedFileSchema>;
