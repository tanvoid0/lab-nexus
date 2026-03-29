"use client";

import Link from "next/link";
import type { AuditLog, User } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faChevronLeft,
  faChevronRight,
  faClock,
  faCode,
  faCube,
  faInbox,
  faUser,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import { AuditActor } from "@/components/admin/audit-actor";
import { AuditEventChips } from "@/components/admin/audit-event-chips";
import { AuditTimestamp } from "@/components/admin/audit-timestamp";
import { auditEntityHref } from "@/lib/audit/entity-href";
import { formatAuditDiffPreview } from "@/lib/audit/format";
import { auditQueryString, type AuditFilterState } from "@/lib/audit/query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type AuditTrailEntry = AuditLog & {
  user: Pick<User, "name" | "email"> | null;
};

function pageHref(state: AuditFilterState, page: number): string {
  return `/admin/audit${auditQueryString({ ...state, page })}`;
}

export function AuditTrailTable(props: {
  entries: AuditTrailEntry[];
  state: AuditFilterState;
  total: number;
}) {
  const { entries, state, total } = props;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  const page = Math.min(state.page, totalPages);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FontAwesomeIcon icon={faClock} className="size-4 opacity-90" aria-hidden />
            Events
          </CardTitle>
          <CardDescription>
            {total} matching {total === 1 ? "row" : "rows"}
            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : null}
          </CardDescription>
        </div>
        {totalPages > 1 ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild>
              <Link href={pageHref(state, Math.max(1, page - 1))} className="gap-1">
                <FontAwesomeIcon icon={faChevronLeft} className="size-3.5" />
                Previous
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
              <Link href={pageHref(state, Math.min(totalPages, page + 1))} className="gap-1">
                Next
                <FontAwesomeIcon icon={faChevronRight} className="size-3.5" />
              </Link>
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 sm:p-0">
        {entries.length === 0 ? (
          <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <FontAwesomeIcon icon={faInbox} className="size-4 shrink-0 opacity-70" aria-hidden />
            No audit events match these filters.
          </p>
        ) : (
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faClock} className="size-3.5 opacity-80" aria-hidden />
                    When (local)
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faWarehouse} className="size-3.5 opacity-80" aria-hidden />
                    Flow
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCube} className="size-3.5 opacity-80" aria-hidden />
                    Entity
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faBolt} className="size-3.5 opacity-80" aria-hidden />
                    Action
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faUser} className="size-3.5 opacity-80" aria-hidden />
                    Actor
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Target id</th>
                <th className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCode} className="size-3.5 opacity-80" aria-hidden />
                    Details
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => {
                const href = auditEntityHref(row.entityType, row.entityId, row.diff);
                const preview = formatAuditDiffPreview(row.diff);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border align-top transition-colors hover:bg-muted/25"
                  >
                    <td className="max-w-[16rem] px-4 py-3 align-top">
                      <AuditTimestamp at={row.createdAt} />
                    </td>
                    <AuditEventChips
                      asTableCells
                      entityType={row.entityType}
                      action={row.action}
                      variant="full"
                    />
                    <td className="px-4 py-3 align-top">
                      <AuditActor user={row.user} />
                    </td>
                    <td className="max-w-[12rem] px-4 py-3 font-mono text-xs break-all">
                      {href ? (
                        <Link href={href} className="text-primary hover:underline">
                          {row.entityId}
                        </Link>
                      ) : (
                        row.entityId
                      )}
                    </td>
                    <td className="max-w-xl px-4 py-3">
                      {preview === "—" ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <FontAwesomeIcon icon={faCode} className="size-3 opacity-50" aria-hidden />
                          —
                        </span>
                      ) : (
                        <details className="cursor-pointer">
                          <summary className="inline-flex list-none items-center gap-1.5 text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                            <FontAwesomeIcon icon={faCode} className="size-3.5 opacity-80" aria-hidden />
                            View payload
                          </summary>
                          <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
                            {JSON.stringify(row.diff, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
