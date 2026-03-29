import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assertDestructiveDbAllowed() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "Refusing to clear DB: NODE_ENV=production. Use a non-production database or unset NODE_ENV for a local wipe.",
    );
    process.exit(1);
  }
  if (process.env.VERCEL_ENV === "production") {
    console.error("Refusing to clear DB: VERCEL_ENV=production.");
    process.exit(1);
  }
}

/**
 * Deletes all documents in application collections (no `dropDatabase`).
 * Works with MongoDB Atlas users that only have readWrite, not dbAdmin.
 */
async function clearAllData() {
  await prisma.assistantConversation.deleteMany();
  await prisma.assistantInbox.deleteMany();
  await prisma.checkoutRequestLine.deleteMany();
  await prisma.checkoutRequest.deleteMany();
  await prisma.checkout.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.assetUnit.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.userCart.deleteMany();
  await prisma.labCurrencyConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lookupEntry.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.location.deleteMany();
}

async function main() {
  assertDestructiveDbAllowed();
  console.log("Clearing all collections…");
  await clearAllData();
  console.log("Done. Collections are empty (indexes kept).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
