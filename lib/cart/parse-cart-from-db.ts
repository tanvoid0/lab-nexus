import type { Prisma } from "@prisma/client";
import { persistedCartLineSchema } from "@/lib/schemas/user-cart";
import type { CartLine } from "@/lib/cart/types";

/** Parse `UserCart.lines` JSON from Prisma; invalid rows are dropped. */
export function parseCartLinesFromDbJson(value: Prisma.JsonValue | null | undefined): CartLine[] {
  if (value == null || !Array.isArray(value)) return [];
  const out: CartLine[] = [];
  for (const row of value) {
    const r = persistedCartLineSchema.safeParse(row);
    if (r.success) out.push(r.data);
  }
  return out;
}
