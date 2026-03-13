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
import { QuarterlyChartCard } from "./QuarterlyChartCard";
import { formatMillions, hasMetricData, type QuarterlyChartDatum } from "./shared";

interface RevenueChartProps {
  data: QuarterlyChartDatum[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = hasMetricData(data, ["revenue"]);

  return (
    <QuarterlyChartCard
      title="Revenue Trend"
      description="Quarterly revenue in millions of USD."
      emptyMessage="Revenue data is currently unavailable for charting."
      hasData={hasData}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
          <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `${value}M`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid rgba(51, 65, 85, 0.9)",
              borderRadius: "16px",
            }}
            formatter={(value) => formatMillions(value)}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Bar dataKey="revenue" fill="#38bdf8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </QuarterlyChartCard>
  );
}
