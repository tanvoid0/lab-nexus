"use client";

import type { AuditAction, AuditEntityType } from "@prisma/client";
import { AuditChip } from "@/components/admin/audit-chip";
import {
  auditActionLabel,
  auditEntityLabel,
  auditFlowForEntityType,
} from "@/lib/audit/labels";
import {
  auditActionVisual,
  auditEntityVisual,
  auditFlowVisualForEntity,
} from "@/lib/audit/visual";

const tdClass = "px-4 py-3";

export function AuditEventChips(props: {
  entityType: AuditEntityType;
  action: AuditAction;
  variant?: "full" | "compact";
  /** Emit three `<td>` cells for the full audit table (must be direct children of `<tr>`). */
  asTableCells?: boolean;
}) {
  const { entityType, action, variant = "full", asTableCells = false } = props;
  const flowVisual = auditFlowVisualForEntity(entityType);
  const entityVisual = auditEntityVisual(entityType);
  const actionVisual = auditActionVisual(action);

  if (asTableCells && variant === "full") {
    return (
      <>
        <td className={tdClass}>
          <AuditChip visual={flowVisual}>{auditFlowForEntityType(entityType)}</AuditChip>
        </td>
        <td className={tdClass}>
          <AuditChip visual={entityVisual}>{auditEntityLabel(entityType)}</AuditChip>
        </td>
        <td className={tdClass}>
          <AuditChip visual={actionVisual}>{auditActionLabel(action)}</AuditChip>
        </td>
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {variant === "full" ? (
        <>
          <AuditChip visual={flowVisual}>{auditFlowForEntityType(entityType)}</AuditChip>
          <AuditChip visual={entityVisual}>{auditEntityLabel(entityType)}</AuditChip>
        </>
      ) : null}
      <AuditChip visual={actionVisual}>{auditActionLabel(action)}</AuditChip>
    </div>
  );
}
