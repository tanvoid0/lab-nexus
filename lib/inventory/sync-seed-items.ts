import type { PrismaClient } from "@prisma/client";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { z } from "zod";
import { assetCreateSchema } from "@/lib/schemas/asset";
import { inventorySeedItemSchema } from "@/lib/schemas/inventory-seed";
import {
  buildSyntheticSeedImageUrl,
  persistImageFromUrl,
} from "@/lib/assets/image-upload";
import {
  DEFAULT_CONDITION_CODE,
  DEFAULT_OPERATIONAL_STATUS_CODE,
} from "@/lib/reference/lookup-defaults";
import { resolveLookupCode } from "@/lib/reference/lookup-validation";

async function ensureCategory(prisma: PrismaClient, name: string) {
  const existing = await prisma.assetCategory.findFirst({
    where: { name, ...notDeleted },
  });
  if (existing) return existing;
  return prisma.assetCategory.create({ data: { name } });
}

async function ensureLocation(prisma: PrismaClient, name: string) {
  const existing = await prisma.location.findFirst({
    where: { name, ...notDeleted },
  });
  if (existing) return existing;
  return prisma.location.create({ data: { name } });
}

/**
 * Upserts inventory seed rows using the same Zod rules as the asset create form
 * (`assetCreateSchema`), after resolving category and location names to IDs.
 */
export async function syncInventorySeedItemsValidated(
  prisma: PrismaClient,
  items: unknown,
): Promise<{
  upserted: number;
  errors: { sku: string; message: string }[];
}> {
  const list = z.array(inventorySeedItemSchema).parse(items);
  const errors: { sku: string; message: string }[] = [];
  let upserted = 0;

  for (const row of list) {
    const sku = row.sku;
    try {
      const cat = await ensureCategory(prisma, row.category);
      const loc = await ensureLocation(prisma, row.location);

      const notes = row.notes?.trim() || undefined;
      const quoteUrl = row.quoteUrl?.trim() || undefined;

      const conditionCode = await resolveLookupCode(
        prisma,
        "ASSET_CONDITION",
        row.condition,
        DEFAULT_CONDITION_CODE,
      );
      const operationalStatusCode = await resolveLookupCode(
        prisma,
        "ASSET_OPERATIONAL_STATUS",
        row.operationalStatus,
        DEFAULT_OPERATIONAL_STATUS_CODE,
      );

      const payload = {
        skuOrInternalId: row.sku.trim(),
        name: row.name.trim(),
        quantityTotal: row.qty,
        quantityAvailable: row.qty,
        conditionCode,
        operationalStatusCode,
        notes,
        quoteUrl: quoteUrl === "" ? undefined : quoteUrl,
        categoryId: cat.id,
        locationId: loc.id,
        acquiredAt:
          row.acquiredAt != null && row.acquiredAt.trim() !== ""
            ? row.acquiredAt.trim()
            : undefined,
      };

      const parsed = assetCreateSchema.safeParse(payload);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        errors.push({ sku, message: msg });
        continue;
      }

      const d = parsed.data;
      const qtyAvail = d.quantityAvailable ?? d.quantityTotal;
      if (qtyAvail > d.quantityTotal) {
        errors.push({
          sku,
          message: "Available quantity cannot exceed total quantity.",
        });
        continue;
      }

      /** Deterministic tag so MongoDB `@unique` on optional `trackTag` never sees duplicate `null`. */
      const seedTrackTag = `INV-${d.skuOrInternalId}`.slice(0, 200);
      const existing = await prisma.asset.findUnique({
        where: { skuOrInternalId: d.skuOrInternalId },
        select: { imagePath: true },
      });

      let imagePath = existing?.imagePath ?? undefined;
      if (!imagePath) {
        const imageUrl =
          row.imageUrl?.trim() || buildSyntheticSeedImageUrl(d.skuOrInternalId);
        imagePath = await persistImageFromUrl(imageUrl, d.skuOrInternalId);
      }

      await prisma.asset.upsert({
        where: { skuOrInternalId: d.skuOrInternalId },
        create: {
          skuOrInternalId: d.skuOrInternalId,
          name: d.name,
          conditionCode: d.conditionCode,
          operationalStatusCode: d.operationalStatusCode,
          quantityTotal: d.quantityTotal,
          quantityAvailable: qtyAvail,
          notes: d.notes?.trim() || undefined,
          quoteUrl: d.quoteUrl?.trim() || undefined,
          imagePath,
          categoryId: d.categoryId || undefined,
          locationId: d.locationId || undefined,
          acquiredAt: d.acquiredAt ? new Date(d.acquiredAt) : undefined,
          trackTag: seedTrackTag,
        },
        update: {
          name: d.name,
          conditionCode: d.conditionCode,
          operationalStatusCode: d.operationalStatusCode,
          quantityTotal: d.quantityTotal,
          quantityAvailable: qtyAvail,
          notes: d.notes?.trim() || undefined,
          quoteUrl: d.quoteUrl?.trim() || undefined,
          imagePath,
          categoryId: d.categoryId || undefined,
          locationId: d.locationId || undefined,
          acquiredAt: d.acquiredAt ? new Date(d.acquiredAt) : undefined,
          trackTag: seedTrackTag,
          deletedAt: null,
        },
      });
      upserted += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ sku, message });
    }
  }

  return { upserted, errors };
}
