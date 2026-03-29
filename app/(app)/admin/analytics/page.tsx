import Link from "next/link";
import { auth } from "@/auth";
import {
  CHECKOUT_STATUS_ORDER,
  getCheckoutBucketsForLastDays,
  getCheckoutStatusCounts,
  getCheckoutStatusDistribution,
} from "@/lib/analytics/checkout-activity";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { accountDisplayLabel } from "@/lib/checkout/borrower-display";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssetsByCategoryPie } from "@/components/admin/analytics/assets-by-category-pie";
import { CheckoutStatusPie } from "@/components/admin/analytics/checkout-status-pie";
import { CheckoutsDailyBarChart } from "@/components/admin/analytics/checkouts-daily-bar-chart";
import { TopBorrowersBarChart } from "@/components/admin/analytics/top-borrowers-bar-chart";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!hasAnyRole(session!.user!.roles ?? [], LAB_ROLES_STAFF)) {
    redirect("/inventory");
  }

  const [dailyChartData, statusPieData, statusCounts, byCategory, topBorrowers] =
    await Promise.all([
      getCheckoutBucketsForLastDays(30),
      getCheckoutStatusDistribution(),
      getCheckoutStatusCounts(),
      prisma.asset.groupBy({
        by: ["categoryId"],
        where: { ...notDeleted },
        _count: { id: true },
      }),
      prisma.checkout.groupBy({
        by: ["userId"],
        _count: { id: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
    ]);

  const checkoutsInRangeTotal = dailyChartData.reduce((s, d) => s + d.count, 0);

  const categories = await prisma.assetCategory.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const categoryRows = byCategory
    .map((b) => ({
      name: b.categoryId ? catName.get(b.categoryId) ?? "Unknown" : "Uncategorized",
      count: b._count.id,
    }))
    .sort((a, b) => b.count - a.count);
  const userIds = topBorrowers.map((t) => t.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true, deletedAt: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const borrowerChartData = topBorrowers.map((t) => {
    const u = userMap.get(t.userId);
    const label = u ? accountDisplayLabel(u) : t.userId.slice(-6);
    return { label, count: t._count.id };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-auto px-2 py-1 text-muted-foreground">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-2xl font-semibold text-primary">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Checkout activity, inventory mix, and borrower activity (aggregates only).
          </p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-primary">Checkouts by status</CardTitle>
          <CardDescription>Share of checkout records by workflow state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-center text-xs text-muted-foreground">
            {CHECKOUT_STATUS_ORDER.map((s) => `${s}: ${statusCounts[s]}`).join(" · ")}
          </p>
          <CheckoutStatusPie data={statusPieData} />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-primary">Checkouts started (last 30 days)</CardTitle>
          <CardDescription>By calendar day, UTC date bucket.</CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutsDailyBarChart data={dailyChartData} />
          <p className="mt-2 text-xs text-muted-foreground">
            Total in range: {checkoutsInRangeTotal}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-primary">Assets by category</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetsByCategoryPie
              data={categoryRows.map((row) => ({ name: row.name, count: row.count }))}
            />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-primary">Top borrowers (all time)</CardTitle>
            <CardDescription>By number of checkout records.</CardDescription>
          </CardHeader>
          <CardContent>
            <TopBorrowersBarChart data={borrowerChartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
