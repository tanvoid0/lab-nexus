import { prisma } from "@/lib/db";

/** Same shape as `prisma.asset.groupBy({ by: ["conditionCode"], _count: { id: true } })` for the admin KPI card. */
export type AssetConditionCountRow = {
  conditionCode: string;
  _count: { id: number };
};

type MongoGroupRow = { _id: string; count: number };

function mongoAggregateFirstBatch<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const cursor = o.cursor as Record<string, unknown> | undefined;
    if (cursor && Array.isArray(cursor.firstBatch)) {
      return cursor.firstBatch as T[];
    }
  }
  return [];
}

/**
 * Counts assets by `conditionCode`. Uses Mongo aggregation with `$ifNull` so legacy docs with null /
 * missing `conditionCode` still work (grouped as UNKNOWN, matching the Prisma schema default).
 */
export async function assetCountByConditionCode(): Promise<AssetConditionCountRow[]> {
  const raw: unknown = await prisma.asset.aggregateRaw({
    pipeline: [
      {
        $match: {
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$conditionCode", "UNKNOWN"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ],
  });

  const batch = mongoAggregateFirstBatch<MongoGroupRow>(raw);
  return batch.map((row) => ({
    conditionCode: row._id,
    _count: { id: row.count },
  }));
}
