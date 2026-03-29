/**
 * Canonical demo identities for **local development** only.
 *
 * - Imported by `prisma/seed.ts` and `lib/actions/dev-quick-login.ts`.
 * - **Do not** import from client components (would bundle secrets).
 * - Override emails with `.env` (`SEED_*`); password via `SEED_DEMO_PASSWORD` or
 *   `prisma/.seed-demo-credentials.json` (created on first local seed — see `lib/dev/demo-credentials.ts`).
 * - Never enable seed or quick login against production (guards in those entry points).
 */

export { getDemoPasswordPlain, prepareDemoPasswordForSeed } from "./demo-credentials";

function envOr(key: string, fallback: string): string {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : fallback;
}

export const DEMO_ADMIN_EMAIL = envOr("SEED_ADMIN_EMAIL", "admin@lab.local");
/** Lab “staff” in the UI maps to the RESEARCHER role in RBAC. */
export const DEMO_STAFF_EMAIL = envOr("SEED_STAFF_EMAIL", "researcher@lab.local");
export const DEMO_STUDENT_EMAIL = envOr("SEED_STUDENT_EMAIL", "student@lab.local");
