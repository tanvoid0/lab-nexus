"use client";

import type { ReactNode } from "react";
import type { AuditAction, AuditEntityType } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faClockRotateLeft,
  faInbox,
} from "@fortawesome/free-solid-svg-icons";
import { CardTitle } from "@/components/ui/card";
import { AuditActor } from "@/components/admin/audit-actor";
import { AuditEventChips } from "@/components/admin/audit-event-chips";
import { AuditTimestamp } from "@/components/admin/audit-timestamp";

const sectionTitleIcon = {
  recent: faClock,
  trail: faClockRotateLeft,
} as const;

export function AuditSectionTitle(props: {
  variant: keyof typeof sectionTitleIcon;
  children: ReactNode;
}) {
  const { variant, children } = props;
  const icon = sectionTitleIcon[variant];
  return (
    <CardTitle className="flex items-center gap-2 text-primary">
      <FontAwesomeIcon icon={icon} className="size-4 opacity-90" aria-hidden />
      {children}
    </CardTitle>
  );
}

export type AuditActivityEntrySerializable = {
  id: string;
  entityType: AuditEntityType;
  action: AuditAction;
  createdAtIso: string;
  user: { name: string | null; email: string } | null;
};

export function AuditActivityEntries(props: {
  entries: AuditActivityEntrySerializable[];
  emptyMessage?: string;
  /** When all rows share one entity (e.g. asset detail), show only the action chip. */
  variant?: "full" | "compact";
}) {
  const { entries, emptyMessage = "No audit events yet.", variant = "full" } = props;

  if (entries.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FontAwesomeIcon icon={faInbox} className="size-4 shrink-0 opacity-70" aria-hidden />
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3 text-sm">
      {entries.map((e) => {
        const at = new Date(e.createdAtIso);
        return (
          <li
            key={e.id}
            className="border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <AuditEventChips entityType={e.entityType} action={e.action} variant={variant} />
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <AuditTimestamp at={at} />
              <AuditActor user={e.user} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
