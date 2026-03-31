import type { AuditAction, AuditEntityType } from "@prisma/client";

const ENTITY_LABEL: Record<AuditEntityType, string> = {
  Asset: "Inventory (asset)",
  Checkout: "Checkout / loan",
  CheckoutRequest: "Checkout request",
  Project: "Project",
  Import: "Spreadsheet import",
  AssetCategory: "Category (reference)",
  Location: "Location (reference)",
  LookupEntry: "Lookup (condition / status)",
  User: "Lab account",
};

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  RETURN: "Returned",
  UNIT_CREATE: "Unit added",
  UNIT_DELETE: "Unit removed",
  MEMBER_ADD: "Member added",
  MEMBER_REMOVE: "Member removed",
  IMPORT: "Import run",
  STATUS_OVERDUE: "Marked overdue",
  CATEGORY_CREATE: "Category created",
  CATEGORY_UPDATE: "Category updated",
  CATEGORY_DELETE: "Category deleted",
  LOCATION_CREATE: "Location created",
  LOCATION_UPDATE: "Location updated",
  LOCATION_DELETE: "Location deleted",
  LOOKUP_CREATE: "Lookup value created",
  LOOKUP_UPDATE: "Lookup value updated",
  LOOKUP_DELETE: "Lookup value deleted",
};

const FLOW_FOR_ENTITY: Record<AuditEntityType, string> = {
  Asset: "Inventory",
  Checkout: "Lending",
  CheckoutRequest: "Lending",
  Project: "Projects",
  Import: "Import",
  AssetCategory: "Reference data",
  Location: "Reference data",
  LookupEntry: "Reference data",
  User: "Accounts",
};

export function auditEntityLabel(entityType: AuditEntityType): string {
  return ENTITY_LABEL[entityType];
}

export function auditActionLabel(action: AuditAction): string {
  return ACTION_LABEL[action];
}

/** Coarse “flow” for grouping in filters and exports. */
export function auditFlowForEntityType(entityType: AuditEntityType): string {
  return FLOW_FOR_ENTITY[entityType];
}
