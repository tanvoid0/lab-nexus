/**
 * Lab Nexus RBAC — **multi-role** model
 *
 * - Canonical roles are stored on `User.roles: string[]` in MongoDB (Prisma).
 * - Auth.js exposes them on `session.user.roles` (JWT session). **Never** trust a
 *   client-sent role; load from the session inside server actions / RSC.
 *
 * **Future OIDC/SAML:** implement `mapExternalProfileToRoles` in the auth module
 * and merge IdP groups into the same `roles` array — **no user-schema migration**.
 *
 * Use `hasRole` / `hasAnyRole` / `assertAnyRole` everywhere instead of ad-hoc checks.
 */

export const LAB_ROLES = ["ADMIN", "RESEARCHER", "STUDENT"] as const;
export type LabRole = (typeof LAB_ROLES)[number];

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
export const ROLE_PRECEDENCE: LabRole[] = ["ADMIN", "RESEARCHER", "STUDENT"];

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
