import Link from "next/link";
import { auth } from "@/auth";
import {
  hasAnyRole,
  hasRole,
  LAB_ROLE,
  LAB_ROLES_STAFF,
} from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AuditActivityEntries,
  AuditSectionTitle,
} from "@/components/admin/audit-activity-entries";
import { AdminToolbarActions } from "@/components/admin/admin-toolbar-actions";
import { Button } from "@/components/ui/button";
import { assetCountByConditionCode } from "@/lib/admin/asset-condition-counts";
import { loadLookupLabelMaps } from "@/lib/reference/lookup-label-maps";
import { checkoutBorrowerLabel } from "@/lib/checkout/borrower-display";

export default async function AdminPage() {
  const session = await auth();
  if (!hasAnyRole(session!.user!.roles ?? [], LAB_ROLES_STAFF)) {
    redirect("/inventory");
  }

  const isAdmin = hasRole(session!.user!.roles ?? [], LAB_ROLE.ADMIN);

  const [
    assetCount,
    availableCount,
    activeCheckoutCount,
    overdueCount,
    byCondition,
    recentAudits,
    overdueList,
    labelMaps,
  ] = await Promise.all([
    prisma.asset.count({ where: { ...notDeleted } }),
    prisma.asset.count({
      where: { operationalStatusCode: "AVAILABLE", ...notDeleted },
    }),
    prisma.checkout.count({ where: { status: "ACTIVE" } }),
    prisma.checkout.count({ where: { status: "OVERDUE" } }),
    assetCountByConditionCode(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.checkout.findMany({
      where: { status: "OVERDUE" },
      include: {
        asset: { select: { id: true, name: true, skuOrInternalId: true } },
        user: { select: { name: true, email: true, deletedAt: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 20,
    }),
    loadLookupLabelMaps(prisma),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Admin</h1>
          <p className="text-sm text-muted-foreground">
            KPIs, overdue items, and quick links.
          </p>
        </div>
        <AdminToolbarActions showReferenceData={isAdmin} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription>Assets</CardDescription>
            <CardTitle className="text-2xl text-primary">{assetCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription>Marked available</CardDescription>
            <CardTitle className="text-2xl text-primary">{availableCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription>Active checkouts</CardDescription>
            <CardTitle className="text-2xl text-primary">{activeCheckoutCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-destructive">{overdueCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-primary">By condition</CardTitle>
            <CardDescription>Counts by condition code (labels in Reference data).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {byCondition.map((b) => (
              <p key={b.conditionCode}>
                {labelMaps.conditionLabelByCode.get(b.conditionCode) ?? b.conditionCode}:{" "}
                {b._count.id}
              </p>
            ))}
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-primary">Reference data</CardTitle>
                <CardDescription>
                  Categories, locations, condition and operational status lookups.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Manage taxonomy used across inventory, imports, and filters.
                </p>
                <Button asChild>
                  <Link href="/admin/reference-data">Open reference data</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-primary">Currencies</CardTitle>
                <CardDescription>
                  Functional (reporting) currency and allowed vendor transaction currencies
                  (Settings subsection).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Aligns with typical ERP inventory: one base currency plus explicit foreign
                  currencies for invoices and POs.
                </p>
                <Button asChild>
                  <Link href="/settings/currencies">Open lab currencies</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-primary">Reference data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Only lab admins can edit categories, locations, and lookup labels. Ask an admin
                if you need new values.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-primary">Overdue checkouts</CardTitle>
          <CardDescription>
            Use <strong>Refresh overdue</strong> in the toolbar or schedule{" "}
            <code className="rounded bg-muted px-1">GET /api/cron/overdue</code> with your{" "}
            <code className="rounded bg-muted px-1">CRON_SECRET</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {overdueList.length === 0 ? (
            <p className="text-muted-foreground">None.</p>
          ) : (
            <ul className="space-y-2">
              {overdueList.map((c) => (
                <li key={c.id} className="flex flex-col border-b border-border pb-2 sm:flex-row sm:justify-between">
                  <div>
                    <Link
                      href={`/inventory/${c.asset.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.asset.name}
                    </Link>
                    <p className="text-muted-foreground">{checkoutBorrowerLabel(c.user)}</p>
                  </div>
                  <p className="text-destructive">Due {c.dueAt.toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <AuditSectionTitle variant="recent">Recent audit activity</AuditSectionTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/audit">Full audit trail</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <AuditActivityEntries
            entries={recentAudits.map((a) => ({
              id: a.id,
              entityType: a.entityType,
              action: a.action,
              createdAtIso: a.createdAt.toISOString(),
              user: a.user,
            }))}
            emptyMessage="No audit events recorded yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
