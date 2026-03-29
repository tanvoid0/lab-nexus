"use client";

import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { AuditVisual } from "@/lib/audit/visual";

export function AuditChip(props: { visual: AuditVisual; children: ReactNode }) {
  const { visual, children } = props;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${visual.chipClass}`}
    >
      <FontAwesomeIcon
        icon={visual.icon}
        className="size-3 shrink-0 text-inherit opacity-90"
        aria-hidden
      />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
