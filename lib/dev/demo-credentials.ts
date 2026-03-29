import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type SeedDemoCredentialsFile = {
  passwordPlain: string;
  createdAt: string;
};

export function seedDemoCredentialsPath(): string {
  return join(process.cwd(), "prisma", ".seed-demo-credentials.json");
}

function tryReadFile(): SeedDemoCredentialsFile | null {
  const p = seedDemoCredentialsPath();
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as SeedDemoCredentialsFile;
    if (typeof raw.passwordPlain === "string" && raw.passwordPlain.length >= 8) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeFileCredentials(passwordPlain: string): void {
  const p = seedDemoCredentialsPath();
  mkdirSync(join(process.cwd(), "prisma"), { recursive: true });
  writeFileSync(
    p,
    `${JSON.stringify(
      { passwordPlain, createdAt: new Date().toISOString() } satisfies SeedDemoCredentialsFile,
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function randomPasswordPlain(): string {
  return randomBytes(18).toString("base64url");
}

/**
 * Resolves the demo password when running `pnpm db:seed`.
 * - `SEED_DEMO_PASSWORD` wins.
 * - When `CI=true`, use a fixed password so scripted E2E can match `E2E_PASSWORD`.
 * - Otherwise reuse `prisma/.seed-demo-credentials.json` if present.
 * - On first local seed, generate a random password and write that file (safe for public clones).
 */
export function prepareDemoPasswordForSeed(): string {
  const fromEnv = process.env.SEED_DEMO_PASSWORD?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.CI === "true") {
    return "labnexus123";
  }

  const existing = tryReadFile();
  if (existing) return existing.passwordPlain;

  const next = randomPasswordPlain();
  writeFileCredentials(next);
  return next;
}

/**
 * Password for dev quick login and manual sign-in (must match seeded hash).
 */
export function getDemoPasswordPlain(): string {
  const fromEnv = process.env.SEED_DEMO_PASSWORD?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.CI === "true") {
    return "labnexus123";
  }

  const fromFile = tryReadFile();
  if (fromFile) return fromFile.passwordPlain;

  // No seed yet (or legacy DB): documented default only applies if the DB was seeded with it.
  return "labnexus123";
}
