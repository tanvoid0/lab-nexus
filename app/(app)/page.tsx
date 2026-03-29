import Link from "next/link";
import { CheckoutStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  CHECKOUT_STATUS_ORDER,
  getCheckoutBucketsForLastDays,
  getCheckoutStatusCounts,
  getCheckoutStatusDistribution,
} from "@/lib/analytics/checkout-activity";
import { hasAnyRole, hasRole, LAB_ROLE, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { DashboardAnalyticsSection } from "@/components/dashboard/dashboard-analytics-section";
import { DashboardQuickLinks } from "@/components/dashboard/dashboard-quick-links";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const user = session.user;
  const userId = user.id;
  const roles = user.roles ?? [];
  const isAdmin = hasRole(roles, LAB_ROLE.ADMIN);
  const showLabAnalytics = hasAnyRole(roles, LAB_ROLES_STAFF);
  const displayName = user.name?.trim() || user.email || "there";

  const openStatuses = [CheckoutStatus.ACTIVE, CheckoutStatus.OVERDUE];
  const openWhere = isAdmin
    ? { status: { in: openStatuses } }
    : { userId, status: { in: openStatuses } };
  const overdueWhere = isAdmin
    ? { status: CheckoutStatus.OVERDUE }
    : { userId, status: CheckoutStatus.OVERDUE };

  const baseQueries = [
    prisma.asset.count({ where: { ...notDeleted } }),
    prisma.project.count({ where: { ...notDeleted } }),
    prisma.checkout.count({ where: openWhere }),
    prisma.checkout.count({ where: overdueWhere }),
    prisma.notification.count({ where: { userId, read: false } }),
  ] as const;

  const [
    assetCount,
    projectCount,
    openCheckoutCount,
    overdueCount,
    unreadNotifications,
    analyticsDaily7,
    analyticsStatusPie,
    analyticsStatusCounts,
  ] = showLabAnalytics
    ? await Promise.all([
        ...baseQueries,
        getCheckoutBucketsForLastDays(7),
        getCheckoutStatusDistribution(),
        getCheckoutStatusCounts(),
      ])
    : [
        ...(await Promise.all(baseQueries)),
        null,
        null,
        null,
      ];

  const statCards: {
    href: string;
    title: string;
    value: number;
    hint: string;
    emphasize?: boolean;
  }[] = [
    {
      href: "/inventory",
      title: "Assets",
      value: assetCount,
      hint: "Catalog items",
    },
    {
      href: "/checkouts",
      title: isAdmin ? "Open checkouts" : "Your open checkouts",
      value: openCheckoutCount,
      hint: "Active and overdue",
    },
    {
      href: "/checkouts",
      title: isAdmin ? "Overdue" : "Your overdue",
      value: overdueCount,
      hint: "Needs attention",
      emphasize: overdueCount > 0,
    },
    {
      href: "/projects",
      title: "Projects",
      value: projectCount,
      hint: "Registered teams",
    },
    {
      href: "/notifications",
      title: "Unread",
      value: unreadNotifications,
      hint: "In your inbox",
      emphasize: unreadNotifications > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {displayName}. Jump in below or open a section from the sidebar.
        </p>
      </div>

      <section aria-labelledby="dashboard-stats-heading" className="space-y-3">
        <h2 id="dashboard-stats-heading" className="text-sm font-medium text-foreground">
          At a glance
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((card) => (
            <li key={card.title}>
              <Link href={card.href} className="block h-full">
                <Card
                  className={
                    card.emphasize
                      ? "h-full border-destructive/40 bg-destructive/5 transition-colors hover:border-destructive/55"
                      : "h-full transition-colors hover:border-primary/30"
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-primary">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-2xl font-semibold tabular-nums text-foreground">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.hint}</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {showLabAnalytics &&
      analyticsDaily7 &&
      analyticsStatusPie &&
      analyticsStatusCounts ? (
        <DashboardAnalyticsSection
          dailyChartData={analyticsDaily7}
          statusPieData={analyticsStatusPie}
          statusSummary={analyticsStatusCounts}
          statusOrder={CHECKOUT_STATUS_ORDER}
        />
      ) : null}

      <section aria-labelledby="dashboard-shortcuts-heading" className="space-y-3">
        <h2 id="dashboard-shortcuts-heading" className="text-sm font-medium text-foreground">
          Go to
        </h2>
        <DashboardQuickLinks unreadNotificationCount={unreadNotifications} />
      </section>
    </div>
  );
}
