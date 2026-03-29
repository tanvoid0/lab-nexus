"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useChartTheme } from "@/lib/analytics/use-chart-theme";

export type DailyCheckoutPoint = {
  /** ISO date yyyy-mm-dd */
  day: string;
  /** Short label for axis (e.g. day of month) */
  label: string;
  count: number;
};

type Props = {
  data: DailyCheckoutPoint[];
  /** Shorter chart for dashboard previews. */
  compact?: boolean;
};

export function CheckoutsDailyBarChart({ data, compact }: Props) {
  const t = useChartTheme();

  return (
    <div
      className={
        compact
          ? "h-44 w-full min-w-0 sm:h-48"
          : "h-56 w-full min-w-0 sm:h-64"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={t.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: t.mutedForeground, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: t.border }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            width={32}
            tick={{ fill: t.mutedForeground, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t.border }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: `1px solid ${t.border}`,
              borderRadius: "var(--radius)",
              color: t.cardForeground,
            }}
            labelFormatter={(label, payload) => {
              const row = payload?.[0]?.payload as DailyCheckoutPoint | undefined;
              return row?.day ?? String(label ?? "");
            }}
            formatter={(value, name) => [`${value ?? 0}`, name === "count" ? "Checkouts" : String(name ?? "")]}
          />
          <Bar dataKey="count" fill={t.primary} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
