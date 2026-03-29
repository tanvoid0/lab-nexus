"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { CheckoutStatusPie } from "@/components/admin/analytics/checkout-status-pie";
import { CheckoutsDailyBarChart } from "@/components/admin/analytics/checkouts-daily-bar-chart";
import type { CheckoutStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type DashboardAnalyticsSectionProps = {
  statusPieData: { status: CheckoutStatus; count: number }[];
  dailyChartData: { day: string; label: string; count: number }[];
  statusSummary: Record<CheckoutStatus, number>;
  statusOrder: readonly CheckoutStatus[];
};

export function DashboardAnalyticsSection({
  statusPieData,
  dailyChartData,
  statusSummary,
  statusOrder,
}: DashboardAnalyticsSectionProps) {
  const totalLastWeek = dailyChartData.reduce((s, d) => s + d.count, 0);

  return (
    <section aria-labelledby="dashboard-analytics-heading" className="space-y-3">
      <h2
        id="dashboard-analytics-heading"
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <FontAwesomeIcon icon={faChartLine} className="size-4 text-primary opacity-90" />
        Lab activity
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-primary">
              Checkouts by status
            </CardTitle>
            <CardDescription>All checkout records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">
              {statusOrder.map((s) => `${s}: ${statusSummary[s]}`).join(" · ")}
            </p>
            <CheckoutStatusPie data={statusPieData} compact />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-primary">
              Checkouts started (last 7 days)
            </CardTitle>
            <CardDescription>Daily volume, UTC buckets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <CheckoutsDailyBarChart data={dailyChartData} compact />
            <p className="text-xs text-muted-foreground">
              Total in range: {totalLastWeek}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/analytics" className="gap-2">
            Full analytics
            <FontAwesomeIcon icon={faArrowRight} className="size-3.5 opacity-80" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
