/**
 * Vehicle Computing Lab RBAC — **multi-role** model
 *
 * - Canonical roles are stored on `User.roles: string[]` in MongoDB (Prisma).
 * - Auth.js exposes them on `session.user.roles` (JWT session). **Never** trust a
 *   client-sent role; load from the session inside server actions / RSC.
 *
 * **Future OIDC/SAML:** implement `mapExternalProfileToRoles` in the auth module
 * and merge IdP groups into the same `roles` array — **no user-schema migration**.
 *
 * Use `hasRole` / `hasAnyRole` / `assertAnyRole` everywhere instead of ad-hoc checks.
 *
 * **Role strings:** use `LAB_ROLE.*` and the `LAB_ROLES_*` tuples — do not duplicate `"ADMIN"` etc.
 */

/** Canonical values stored in `User.roles` and on the session. Change here (and seed / IdP mapping) together. */
export const LAB_ROLE = {
  ADMIN: "ADMIN",
  RESEARCHER: "RESEARCHER",
  STUDENT: "STUDENT",
} as const;

export type LabRole = (typeof LAB_ROLE)[keyof typeof LAB_ROLE];

export const LAB_ROLES = [
  LAB_ROLE.ADMIN,
  LAB_ROLE.RESEARCHER,
  LAB_ROLE.STUDENT,
] as const;

/** Staff: inventory/project management, exports, fulfilling requests, most admin surfaces. */
export const LAB_ROLES_STAFF = [LAB_ROLE.ADMIN, LAB_ROLE.RESEARCHER] as const;

/** Routes and actions restricted to lab administrators only. */
export const LAB_ROLES_ADMIN_ONLY = [LAB_ROLE.ADMIN] as const;

export function hasRole(roles: string[] | undefined, role: LabRole): boolean {
  return !!roles?.includes(role);
}

export function hasAnyRole(
  roles: string[] | undefined,
  allowed: readonly LabRole[],
): boolean {
  if (!roles?.length) return false;
  return allowed.some((r) => roles.includes(r));
}

export function assertAnyRole(
  roles: string[] | undefined,
  allowed: readonly LabRole[],
): void {
  if (!hasAnyRole(roles, allowed)) {
    throw new ForbiddenError();
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Display-only precedence: ADMIN > RESEARCHER > STUDENT — not for authorization. */
export const ROLE_PRECEDENCE: LabRole[] = [...LAB_ROLES];

export function effectivePrimaryRole(
  roles: string[] | undefined,
): LabRole | null {
  if (!roles?.length) return null;
  for (const r of ROLE_PRECEDENCE) {
    if (roles.includes(r)) return r;
  }
  return null;
}

/**
 * Map external IdP profile → lab roles. **Stub** until OIDC/SAML is enabled;
 * keep all provider-specific mapping here so the rest of the app stays unchanged.
 */
export function mapExternalProfileToRoles(profile: unknown): LabRole[] {
  void profile;
  return [];
}
