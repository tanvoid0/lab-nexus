/**
 * Canonical demo identities for **local development** only.
 *
 * - Imported by `prisma/seed.ts` and `lib/actions/dev-quick-login.ts`.
 * - **Do not** import from client components (would bundle the password).
 * - Password and emails must stay aligned with the seeder; never enable seed or
 *   quick login against production (see guards in those entry points).
 */

export const DEMO_PASSWORD_PLAINTEXT = "labnexus123";

export const DEMO_ADMIN_EMAIL = "admin@lab.local";
/** Lab “staff” in the UI maps to the RESEARCHER role in RBAC. */
export const DEMO_STAFF_EMAIL = "researcher@lab.local";
export const DEMO_STUDENT_EMAIL = "student@lab.local";
