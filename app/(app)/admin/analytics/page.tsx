import Link from "next/link";
import type { CheckoutStatus } from "@prisma/client";
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
import { Button } from "@/components/ui/button";

const DAY_MS = 86_400_000;

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!hasAnyRole(session!.user!.roles ?? [], ["ADMIN", "RESEARCHER"])) {
    redirect("/inventory");
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [checkoutsInRange, byCategory, topBorrowers, returnStats] =
    await Promise.all([
      prisma.checkout.findMany({
        where: { checkedOutAt: { gte: thirtyDaysAgo } },
        select: { checkedOutAt: true },
      }),
      prisma.asset.groupBy({
        by: ["categoryId"],
        _count: { id: true },
      }),
      prisma.checkout.groupBy({
        by: ["userId"],
        _count: { id: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      prisma.checkout.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

  const categories = await prisma.assetCategory.findMany({
    select: { id: true, name: true },
  });
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const dayKeys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const perDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0]),
  );
  for (const c of checkoutsInRange) {
    const k = c.checkedOutAt.toISOString().slice(0, 10);
    if (k in perDay) perDay[k] += 1;
  }
  const maxDay = Math.max(1, ...Object.values(perDay));

  const categoryRows = byCategory
    .map((b) => ({
      name: b.categoryId ? catName.get(b.categoryId) ?? "Unknown" : "Uncategorized",
      count: b._count.id,
    }))
    .sort((a, b) => b.count - a.count);
  const maxCat = Math.max(1, ...categoryRows.map((r) => r.count));

  const userIds = topBorrowers.map((t) => t.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const maxBorrow = Math.max(1, ...topBorrowers.map((t) => t._count.id));

  const statusOrder: CheckoutStatus[] = ["ACTIVE", "RETURNED", "OVERDUE"];
  const statusCounts: Partial<Record<CheckoutStatus, number>> = {};
  for (const s of returnStats) {
    statusCounts[s.status] = s._count.id;
  }

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

      <div className="grid gap-4 sm:grid-cols-3">
        {statusOrder.map((status) => (
          <Card key={status} className="border-border">
            <CardHeader className="pb-2">
              <CardDescription>Checkouts — {status}</CardDescription>
              <CardTitle className="text-2xl text-primary">
                {statusCounts[status] ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-primary">Checkouts started (last 30 days)</CardTitle>
          <CardDescription>By calendar day, UTC date bucket.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex h-40 items-end gap-0.5 sm:gap-1"
            role="img"
            aria-label="Bar chart of checkouts per day"
          >
            {dayKeys.map((day) => {
              const n = perDay[day] ?? 0;
              const pct = (n / maxDay) * 100;
              return (
                <div
                  key={day}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  title={`${day}: ${n}`}
                >
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[14px] rounded-t bg-primary/80 sm:max-w-[20px]"
                      style={{ height: `${Math.max(pct, n > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className="hidden text-[9px] text-muted-foreground sm:block">
                    {day.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Total in range: {checkoutsInRange.length}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-primary">Assets by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assets.</p>
            ) : (
              categoryRows.map((row) => (
                <div key={row.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{row.name}</span>
                    <span className="text-muted-foreground">{row.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(row.count / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-primary">Top borrowers (all time)</CardTitle>
            <CardDescription>By number of checkout records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBorrowers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checkouts yet.</p>
            ) : (
              topBorrowers.map((t) => {
                const u = userMap.get(t.userId);
                const label = u?.name || u?.email || t.userId.slice(-6);
                const n = t._count.id;
                return (
                  <div key={t.userId}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate pr-2" title={u?.email}>
                        {label}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(n / maxBorrow) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
