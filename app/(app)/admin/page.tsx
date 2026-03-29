import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCategoryAction, createLocationAction } from "@/lib/actions/admin";
import { AdminToolbarActions } from "@/components/admin/admin-toolbar-actions";
import { AdminMiniForm } from "./admin-mini-form";

export default async function AdminPage() {
  const session = await auth();
  if (!hasAnyRole(session!.user!.roles ?? [], ["ADMIN", "RESEARCHER"])) {
    redirect("/inventory");
  }

  const [
    assetCount,
    availableCount,
    activeCheckoutCount,
    overdueCount,
    byCondition,
    recentAudits,
    overdueList,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { operationalStatus: "AVAILABLE" } }),
    prisma.checkout.count({ where: { status: "ACTIVE" } }),
    prisma.checkout.count({ where: { status: "OVERDUE" } }),
    prisma.asset.groupBy({
      by: ["condition"],
      _count: { id: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.checkout.findMany({
      where: { status: "OVERDUE" },
      include: {
        asset: { select: { id: true, name: true, skuOrInternalId: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Admin</h1>
          <p className="text-sm text-muted-foreground">
            KPIs, overdue items, and reference data.
          </p>
        </div>
        <AdminToolbarActions />
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
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {byCondition.map((b) => (
              <p key={b.condition}>
                {b.condition}: {b._count.id}
              </p>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-primary">New category</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminMiniForm action={createCategoryAction} fieldName="name" label="Name" />
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-primary">New location</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminMiniForm action={createLocationAction} fieldName="name" label="Name" />
            </CardContent>
          </Card>
        </div>
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
                    <p className="text-muted-foreground">{c.user.name || c.user.email}</p>
                  </div>
                  <p className="text-destructive">Due {c.dueAt.toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-primary">Recent audit activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recentAudits.map((a) => (
            <div key={a.id} className="border-b border-border pb-2 last:border-0">
              <span className="font-medium">{a.action}</span>{" "}
              <span className="text-muted-foreground">{a.entityType}</span>{" "}
              <span className="text-muted-foreground">
                {a.createdAt.toLocaleString()}
              </span>
              {a.user ? (
                <span className="text-muted-foreground">
                  {" "}
                  — {a.user.name || a.user.email}
                </span>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
