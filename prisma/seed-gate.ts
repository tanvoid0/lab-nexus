import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { DEMO_ADMIN_EMAIL } from "../lib/dev/demo-auth";
import { LAB_CURRENCY_CONFIG_ID } from "../lib/currency/constants";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const prisma = new PrismaClient();

async function waitForDbReady(maxAttempts = 20) {
  let lastErr: unknown = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await prisma.$runCommandRaw({ ping: 1 });
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw lastErr;
}

async function isSeeded() {
  // Sentinel: seed.ts always upserts these; if they exist, assume demo seed is present.
  const [adminCount, labCurrencyCount] = await Promise.all([
    prisma.user.count({ where: { email: DEMO_ADMIN_EMAIL } }),
    prisma.labCurrencyConfig.count({ where: { id: LAB_CURRENCY_CONFIG_ID } }),
  ]);

  return adminCount > 0 && labCurrencyCount > 0;
}

function runSeedTs() {
  // Run via the repo's `tsx` binary inside the image (avoid `npx` / network access).
  const tsxBin = join(process.cwd(), "node_modules", ".bin", "tsx");
  execFileSync(tsxBin, ["prisma/seed.ts"], {
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  await waitForDbReady();

  if (await isSeeded()) {
    console.log("Seed gate: demo data already present; skipping `prisma/seed.ts`.");
    return;
  }

  console.log("Seed gate: demo data missing; running `prisma/seed.ts`...");
  runSeedTs();
}

main()
  .catch((e) => {
    console.error("Seed gate failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

