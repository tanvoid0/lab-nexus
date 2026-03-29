"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartTheme } from "@/lib/analytics/use-chart-theme";
import { useChartTheme } from "@/lib/analytics/use-chart-theme";

export type CategorySlice = {
  name: string;
  count: number;
};

type Props = {
  data: CategorySlice[];
};

function sliceColors(theme: ChartTheme, n: number): string[] {
  const base = [theme.primary, theme.accent, theme.mutedForeground, theme.border, theme.destructive];
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

export function AssetsByCategoryPie({ data }: Props) {
  const t = useChartTheme();
  const colors = sliceColors(t, data.length);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No assets.</p>;
  }

  const chartData = data.map((row, i) => ({ ...row, fill: colors[i] }));

  return (
    <div className="h-72 w-full min-w-0 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 4, bottom: 8, left: 4 }}>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="42%"
            cy="50%"
            outerRadius={78}
            paddingAngle={1}
            label={false}
          >
            {chartData.map((row) => (
              <Cell key={row.name} fill={row.fill} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: `1px solid ${t.border}`,
              borderRadius: "var(--radius)",
              color: t.cardForeground,
            }}
            formatter={(value, name) => [`${value ?? 0} assets`, String(name ?? "")]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{
              fontSize: 11,
              color: t.mutedForeground,
              maxHeight: "min(16rem, 70vh)",
              overflowY: "auto",
              paddingLeft: 4,
            }}
            formatter={(value) => (
              <span className="max-w-[11rem] truncate text-card-foreground" title={value}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
