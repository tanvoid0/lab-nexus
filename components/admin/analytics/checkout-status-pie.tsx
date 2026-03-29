"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useChartTheme } from "@/lib/analytics/use-chart-theme";

export type StatusSlice = {
  status: string;
  count: number;
};

type Props = {
  data: StatusSlice[];
  /** Shorter layout for dashboard preview. */
  compact?: boolean;
};

export function CheckoutStatusPie({ data, compact }: Props) {
  const t = useChartTheme();

  const colored = data.map((row) => ({
    ...row,
    name: row.status,
    fill:
      row.status === "OVERDUE"
        ? t.destructive
        : row.status === "RETURNED"
          ? t.mutedForeground
          : t.primary,
  }));

  if (colored.length === 0) {
    return <p className="text-sm text-muted-foreground">No checkout records.</p>;
  }

  return (
    <div
      className={
        compact ? "h-48 w-full min-w-0 sm:h-52" : "h-56 w-full min-w-0 sm:h-64"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          margin={
            compact
              ? { top: 2, right: 6, bottom: 44, left: 6 }
              : { top: 4, right: 8, bottom: 52, left: 8 }
          }
        >
          <Pie
            data={colored}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy={compact ? "44%" : "46%"}
            innerRadius={compact ? 36 : 44}
            outerRadius={compact ? 56 : 68}
            paddingAngle={2}
          >
            {colored.map((row) => (
              <Cell key={row.status} fill={row.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: `1px solid ${t.border}`,
              borderRadius: "var(--radius)",
              color: t.cardForeground,
            }}
            formatter={(value, name) => [`${value ?? 0}`, String(name ?? "")]}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            layout="horizontal"
            wrapperStyle={{
              fontSize: compact ? 11 : 12,
              color: t.mutedForeground,
              width: "100%",
              paddingTop: compact ? 4 : 8,
            }}
            formatter={(value) => <span className="text-card-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
