"use client";

import Link from "next/link";
import type { User } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/lib/form/native-field-classes";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, AUDIT_PAGE_SIZES } from "@/lib/audit/constants";
import { auditActionLabel, auditEntityLabel } from "@/lib/audit/labels";
import { auditQueryString, type AuditFilterState } from "@/lib/audit/query";

export type AuditTrailUserOption = Pick<User, "id" | "email" | "name" | "deletedAt">;

export function AuditTrailFilters(props: {
  users: AuditTrailUserOption[];
  state: AuditFilterState;
}) {
  const { users, state } = props;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <FontAwesomeIcon icon={faFileLines} className="size-4 opacity-90" />
          Filters
        </CardTitle>
        <CardDescription>
          Narrow by actor, flow, entity, action, id, or date range. A specific{" "}
          <strong>Entity type</strong> overrides <strong>Flow</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-actor" className="text-muted-foreground font-normal">
              Actor
            </Label>
            <select
              id="audit-filter-actor"
              name="actor"
              defaultValue={state.actor}
              className={nativeSelectClassName()}
            >
              <option value="all">All events</option>
              <option value="human">Signed-in user only</option>
              <option value="system">System / scheduled (no user)</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-flow" className="text-muted-foreground font-normal">
              Flow
            </Label>
            <select
              id="audit-filter-flow"
              name="flow"
              defaultValue={state.flow}
              className={nativeSelectClassName()}
            >
              <option value="">Any flow</option>
              <option value="Inventory">Inventory</option>
              <option value="Lending">Lending (checkouts & cart)</option>
              <option value="Projects">Projects</option>
              <option value="Import">Import</option>
              <option value="Reference data">Reference data</option>
              <option value="Accounts">Accounts</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-entity" className="text-muted-foreground font-normal">
              Entity type
            </Label>
            <select
              id="audit-filter-entity"
              name="entity"
              defaultValue={state.entityType}
              className={nativeSelectClassName()}
            >
              <option value="">Any</option>
              {AUDIT_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {auditEntityLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-action" className="text-muted-foreground font-normal">
              Action
            </Label>
            <select
              id="audit-filter-action"
              name="action"
              defaultValue={state.action}
              className={nativeSelectClassName()}
            >
              <option value="">Any</option>
              {AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {auditActionLabel(a)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-user" className="text-muted-foreground font-normal">
              User (actor)
            </Label>
            <select
              id="audit-filter-user"
              name="user"
              defaultValue={state.userId}
              className={nativeSelectClassName()}
            >
              <option value="">Any user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                  {u.deletedAt ? " (deactivated)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-entity-id" className="text-muted-foreground font-normal">
              Entity id / ref
            </Label>
            <Input
              id="audit-filter-entity-id"
              name="entityId"
              type="text"
              defaultValue={state.entityId}
              placeholder="ObjectId or import id"
              className="font-mono"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-from" className="text-muted-foreground font-normal">
              From (UTC date)
            </Label>
            <Input id="audit-filter-from" name="from" type="date" defaultValue={state.from} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-to" className="text-muted-foreground font-normal">
              To (UTC date)
            </Label>
            <Input id="audit-filter-to" name="to" type="date" defaultValue={state.to} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="audit-filter-page-size" className="text-muted-foreground font-normal">
              Page size
            </Label>
            <select
              id="audit-filter-page-size"
              name="pageSize"
              defaultValue={String(state.pageSize)}
              className={nativeSelectClassName()}
            >
              {AUDIT_PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/audit">Reset</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <a
                href={`/api/admin/export/audit${auditQueryString({ ...state, page: 1 })}`}
                className="gap-2"
              >
                <FontAwesomeIcon icon={faFileLines} className="size-4" />
                Export CSV (current filters)
              </a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
