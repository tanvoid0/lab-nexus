import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration (replaces deprecated `package.json#prisma`).
 * With a config file present, the CLI does not auto-load `.env`; `dotenv/config` restores that.
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
