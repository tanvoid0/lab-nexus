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

export type BorrowerRow = {
  label: string;
  count: number;
};

type Props = {
  data: BorrowerRow[];
};

export function TopBorrowersBarChart({ data }: Props) {
  const t = useChartTheme();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No checkouts yet.</p>;
  }

  return (
    <div className="h-[min(24rem,70vh)] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
        >
          <CartesianGrid stroke={t.border} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: t.mutedForeground, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t.border }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={112}
            tick={{ fill: t.mutedForeground, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t.border }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: `1px solid ${t.border}`,
              borderRadius: "var(--radius)",
              color: t.cardForeground,
            }}
            formatter={(value) => [`${value ?? 0} checkouts`, ""]}
          />
          <Bar dataKey="count" fill={t.accent} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
