/**
 * One-time MongoDB migration: copy legacy Prisma enum fields `condition` / `operationalStatus`
 * on Asset documents into `conditionCode` / `operationalStatusCode`, then remove the old keys.
 *
 * Run after `pnpm db:push` when upgrading from schema versions that used AssetCondition /
 * AssetOperationalStatus enums on Asset:
 *
 *   pnpm exec tsx prisma/migrate-legacy-asset-enums.ts
 *
 * Safe to run multiple times.
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$runCommandRaw({
      update: "Asset",
      updates: [
        {
          q: {},
          u: [
            {
              $set: {
                conditionCode: {
                  $ifNull: ["$conditionCode", { $ifNull: ["$condition", "UNKNOWN"] }],
                },
                operationalStatusCode: {
                  $ifNull: [
                    "$operationalStatusCode",
                    { $ifNull: ["$operationalStatus", "AVAILABLE"] },
                  ],
                },
              },
            },
            { $unset: ["condition", "operationalStatus"] },
          ],
          multi: true,
        },
      ],
    });
    console.log("migrate-legacy-asset-enums:", JSON.stringify(res));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
