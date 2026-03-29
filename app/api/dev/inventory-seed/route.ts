import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  RATE_WINDOW_MS,
  rateLimitIpOr429,
} from "@/lib/api/rate-limit-http";
import { prisma } from "@/lib/db";
import { loadInventorySeedFile } from "@/lib/inventory/load-inventory-seed-file";
import { ensureDefaultLookupEntries } from "@/lib/reference/ensure-lookups";
import { syncInventorySeedItemsValidated } from "@/lib/inventory/sync-seed-items";
import { inventorySeedRequestSchema } from "@/lib/schemas/inventory-seed";
import { ZodError, z } from "zod";

const postBodySchema = z.union([
  inventorySeedRequestSchema,
  z.object({ loadDefaultFile: z.literal(true) }),
]);

/**
 * Dev-only bulk upsert for seed inventory rows.
 * Uses the same `assetCreateSchema` validation as the asset create form (`lib/inventory/sync-seed-items`).
 *
 * POST JSON body:
 * - `{ "items": [ ... ] }` — same shape as the `items` array in a seed JSON file, or
 * - `{ "loadDefaultFile": true }` — load via `loadInventorySeedFile()` (optional JSON file, else synthetic).
 *
 * Header: `Authorization: Bearer $SEED_SECRET`
 */
export async function POST(req: Request) {
  const limited = rateLimitIpOr429(req, "api:dev:inventory-seed", 40, RATE_WINDOW_MS);
  if (limited) return limited;

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SEED_SECRET is not configured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let items: unknown[];
  try {
    const json: unknown = await req.json();
    const body = postBodySchema.parse(json);
    if ("loadDefaultFile" in body) {
      items = loadInventorySeedFile().items;
    } else {
      items = body.items;
    }
  } catch (e) {
    const msg = e instanceof ZodError ? e.flatten() : { message: String(e) };
    return NextResponse.json({ error: "Invalid body", details: msg }, { status: 400 });
  }

  await ensureDefaultLookupEntries(prisma);
  const { upserted, errors } = await syncInventorySeedItemsValidated(prisma, items);

  revalidatePath("/inventory");
  revalidatePath("/admin");

  const status =
    errors.length > 0 && upserted === 0 && items.length > 0 ? 422 : 200;
  return NextResponse.json({ upserted, errors, total: items.length }, { status });
}

/** GET returns route metadata only (no mutation). */
export async function GET(req: Request) {
  const limited = rateLimitIpOr429(req, "api:dev:inventory-seed", 40, RATE_WINDOW_MS);
  if (limited) return limited;

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    description:
      "POST with Bearer SEED_SECRET. Body: { items } or { loadDefaultFile: true } (optional prisma/data/inventory-seed.json or synthetic). Validates with assetCreateSchema.",
  });
}
