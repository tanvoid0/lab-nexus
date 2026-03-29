import { AuditAction, AuditEntityType } from "@prisma/client";

/** Mirrors `AuditEntityType` in `prisma/schema.prisma` — filters and forms use these values only. */
export const AUDIT_ENTITY_TYPES = Object.values(AuditEntityType) as AuditEntityType[];

/** Mirrors `AuditAction` in `prisma/schema.prisma`. */
export const AUDIT_ACTIONS = Object.values(AuditAction) as AuditAction[];

export type { AuditAction, AuditEntityType } from "@prisma/client";

export const AUDIT_PAGE_SIZES = [25, 50, 100] as const;
