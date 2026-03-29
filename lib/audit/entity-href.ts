import { AuditEntityType } from "@prisma/client";
import { assetDetailPath } from "@/lib/nav/inventory-paths";

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/** Deep link from an audit row to a relevant app route, when resolvable. */
export function auditEntityHref(
  entityType: AuditEntityType,
  entityId: string,
  diff: unknown,
): string | null {
  if (!OBJECT_ID_RE.test(entityId)) return null;
  if (entityType === AuditEntityType.Asset) return assetDetailPath(entityId);
  if (entityType === AuditEntityType.LookupEntry) return `/admin/reference-data`;
  if (entityType === AuditEntityType.Project) return `/projects/${entityId}`;
  if (entityType === AuditEntityType.User) return "/admin/users";
  if (entityType === AuditEntityType.CheckoutRequest) {
    return `/requests/${entityId}`;
  }
  if (entityType === AuditEntityType.Checkout) {
    const assetId =
      diff &&
      typeof diff === "object" &&
      "assetId" in diff &&
      typeof (diff as { assetId?: unknown }).assetId === "string"
        ? (diff as { assetId: string }).assetId
        : null;
    if (assetId && OBJECT_ID_RE.test(assetId)) {
      return assetDetailPath(assetId);
    }
    return "/checkouts";
  }
  return null;
}
