import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import {
  faBook,
  faCube,
  faDiagramProject,
  faFileImport,
  faFileLines,
  faHandHolding,
  faListUl,
  faLocationDot,
  faPen,
  faPenToSquare,
  faPlus,
  faRotateLeft,
  faSquareMinus,
  faSquarePlus,
  faTableList,
  faTag,
  faTrash,
  faTriangleExclamation,
  faUser,
  faUserMinus,
  faUserPlus,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";

import { auditFlowForEntityType } from "@/lib/audit/labels";

/** Icon + pill classes (use theme foreground for text/icons — readable in light & dark). */
export type AuditVisual = {
  icon: IconDefinition;
  chipClass: string;
};

const entityVisual = {
  Asset: {
    icon: faCube,
    chipClass:
      "border-sky-600/35 bg-sky-500/15 text-foreground dark:border-sky-400/40 dark:bg-sky-400/12 dark:text-foreground",
  },
  Checkout: {
    icon: faHandHolding,
    chipClass:
      "border-violet-600/35 bg-violet-500/15 text-foreground dark:border-violet-400/40 dark:bg-violet-400/12 dark:text-foreground",
  },
  Project: {
    icon: faDiagramProject,
    chipClass:
      "border-indigo-600/35 bg-indigo-500/15 text-foreground dark:border-indigo-400/40 dark:bg-indigo-400/12 dark:text-foreground",
  },
  Import: {
    icon: faFileImport,
    chipClass:
      "border-fuchsia-600/35 bg-fuchsia-500/15 text-foreground dark:border-fuchsia-400/40 dark:bg-fuchsia-400/12 dark:text-foreground",
  },
  AssetCategory: {
    icon: faTag,
    chipClass:
      "border-amber-600/40 bg-amber-500/18 text-foreground dark:border-amber-400/45 dark:bg-amber-400/14 dark:text-foreground",
  },
  Location: {
    icon: faLocationDot,
    chipClass:
      "border-teal-600/35 bg-teal-500/15 text-foreground dark:border-teal-400/40 dark:bg-teal-400/12 dark:text-foreground",
  },
  LookupEntry: {
    icon: faTableList,
    chipClass:
      "border-orange-600/35 bg-orange-500/15 text-foreground dark:border-orange-400/40 dark:bg-orange-400/12 dark:text-foreground",
  },
  User: {
    icon: faUser,
    chipClass:
      "border-slate-600/35 bg-slate-500/15 text-foreground dark:border-slate-400/40 dark:bg-slate-400/12 dark:text-foreground",
  },
} as unknown as Record<AuditEntityType, AuditVisual>;

const flowVisualByName: Record<string, AuditVisual> = {
  Inventory: {
    icon: faWarehouse,
    chipClass:
      "border-sky-600/35 bg-sky-500/15 text-foreground dark:border-sky-400/40 dark:bg-sky-400/12 dark:text-foreground",
  },
  Lending: {
    icon: faHandHolding,
    chipClass:
      "border-violet-600/35 bg-violet-500/15 text-foreground dark:border-violet-400/40 dark:bg-violet-400/12 dark:text-foreground",
  },
  Projects: {
    icon: faDiagramProject,
    chipClass:
      "border-indigo-600/35 bg-indigo-500/15 text-foreground dark:border-indigo-400/40 dark:bg-indigo-400/12 dark:text-foreground",
  },
  Import: {
    icon: faFileImport,
    chipClass:
      "border-fuchsia-600/35 bg-fuchsia-500/15 text-foreground dark:border-fuchsia-400/40 dark:bg-fuchsia-400/12 dark:text-foreground",
  },
  "Reference data": {
    icon: faBook,
    chipClass:
      "border-amber-600/40 bg-amber-500/18 text-foreground dark:border-amber-400/45 dark:bg-amber-400/14 dark:text-foreground",
  },
  Accounts: {
    icon: faUser,
    chipClass:
      "border-slate-600/35 bg-slate-500/15 text-foreground dark:border-slate-400/40 dark:bg-slate-400/12 dark:text-foreground",
  },
};

const actionVisual = {
  CREATE: {
    icon: faPlus,
    chipClass:
      "border-emerald-600/40 bg-emerald-500/18 text-foreground dark:border-emerald-400/45 dark:bg-emerald-400/14 dark:text-foreground",
  },
  UPDATE: {
    icon: faPenToSquare,
    chipClass:
      "border-blue-600/40 bg-blue-500/18 text-foreground dark:border-blue-400/45 dark:bg-blue-400/14 dark:text-foreground",
  },
  DELETE: {
    icon: faTrash,
    chipClass:
      "border-red-600/45 bg-red-500/18 text-foreground dark:border-red-400/50 dark:bg-red-400/14 dark:text-foreground",
  },
  RETURN: {
    icon: faRotateLeft,
    chipClass:
      "border-cyan-600/40 bg-cyan-500/18 text-foreground dark:border-cyan-400/45 dark:bg-cyan-400/14 dark:text-foreground",
  },
  UNIT_CREATE: {
    icon: faSquarePlus,
    chipClass:
      "border-emerald-600/40 bg-emerald-500/18 text-foreground dark:border-emerald-400/45 dark:bg-emerald-400/14 dark:text-foreground",
  },
  UNIT_DELETE: {
    icon: faSquareMinus,
    chipClass:
      "border-red-600/45 bg-red-500/18 text-foreground dark:border-red-400/50 dark:bg-red-400/14 dark:text-foreground",
  },
  MEMBER_ADD: {
    icon: faUserPlus,
    chipClass:
      "border-emerald-600/40 bg-emerald-500/18 text-foreground dark:border-emerald-400/45 dark:bg-emerald-400/14 dark:text-foreground",
  },
  MEMBER_REMOVE: {
    icon: faUserMinus,
    chipClass:
      "border-red-600/45 bg-red-500/18 text-foreground dark:border-red-400/50 dark:bg-red-400/14 dark:text-foreground",
  },
  IMPORT: {
    icon: faFileLines,
    chipClass:
      "border-fuchsia-600/35 bg-fuchsia-500/15 text-foreground dark:border-fuchsia-400/40 dark:bg-fuchsia-400/12 dark:text-foreground",
  },
  STATUS_OVERDUE: {
    icon: faTriangleExclamation,
    chipClass:
      "border-amber-600/50 bg-amber-500/22 text-foreground dark:border-amber-400/50 dark:bg-amber-400/16 dark:text-foreground",
  },
  CATEGORY_CREATE: {
    icon: faPlus,
    chipClass:
      "border-emerald-600/40 bg-emerald-500/18 text-foreground dark:border-emerald-400/45 dark:bg-emerald-400/14 dark:text-foreground",
  },
  CATEGORY_UPDATE: {
    icon: faPen,
    chipClass:
      "border-blue-600/40 bg-blue-500/18 text-foreground dark:border-blue-400/45 dark:bg-blue-400/14 dark:text-foreground",
  },
  CATEGORY_DELETE: {
    icon: faTrash,
    chipClass:
      "border-red-600/45 bg-red-500/18 text-foreground dark:border-red-400/50 dark:bg-red-400/14 dark:text-foreground",
  },
  LOCATION_CREATE: {
    icon: faPlus,
    chipClass:
      "border-emerald-600/40 bg-emerald-500/18 text-foreground dark:border-emerald-400/45 dark:bg-emerald-400/14 dark:text-foreground",
  },
  LOCATION_UPDATE: {
    icon: faPen,
    chipClass:
      "border-blue-600/40 bg-blue-500/18 text-foreground dark:border-blue-400/45 dark:bg-blue-400/14 dark:text-foreground",
  },
  LOCATION_DELETE: {
    icon: faTrash,
    chipClass:
      "border-red-600/45 bg-red-500/18 text-foreground dark:border-red-400/50 dark:bg-red-400/14 dark:text-foreground",
  },
  LOOKUP_CREATE: {
    icon: faPlus,
    chipClass:
      "border-emerald-600/40 bg-emerald-500/18 text-foreground dark:border-emerald-400/45 dark:bg-emerald-400/14 dark:text-foreground",
  },
  LOOKUP_UPDATE: {
    icon: faPen,
    chipClass:
      "border-blue-600/40 bg-blue-500/18 text-foreground dark:border-blue-400/45 dark:bg-blue-400/14 dark:text-foreground",
  },
  LOOKUP_DELETE: {
    icon: faTrash,
    chipClass:
      "border-red-600/45 bg-red-500/18 text-foreground dark:border-red-400/50 dark:bg-red-400/14 dark:text-foreground",
  },
} as unknown as Record<AuditAction, AuditVisual>;

export function auditEntityVisual(entityType: AuditEntityType): AuditVisual {
  return entityVisual[entityType];
}

export function auditActionVisual(action: AuditAction): AuditVisual {
  return actionVisual[action];
}

/** Flow label matches `auditFlowForEntityType` strings (filter UI uses shorter “Lending” wording; table uses entity-derived flow). */
export function auditFlowVisualForEntity(entityType: AuditEntityType): AuditVisual {
  const flow = auditFlowForEntityType(entityType);
  return flowVisualByName[flow] ?? {
    icon: faListUl,
    chipClass: "border-border bg-muted/70 text-foreground dark:bg-muted/50 dark:text-foreground",
  };
}
