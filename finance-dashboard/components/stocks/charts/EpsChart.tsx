"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QuarterlyChartCard } from "./QuarterlyChartCard";
import { formatUsdPerShare, hasMetricData, type QuarterlyChartDatum } from "./shared";

interface EpsChartProps {
  data: QuarterlyChartDatum[];
}

export function EpsChart({ data }: EpsChartProps) {
  const hasData = hasMetricData(data, ["eps"]);

  return (
    <QuarterlyChartCard
      title="EPS Trend"
      description="Quarterly earnings per share in USD per share."
      emptyMessage="EPS data is currently unavailable for charting."
      hasData={hasData}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
          <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid rgba(51, 65, 85, 0.9)",
              borderRadius: "16px",
            }}
            formatter={(value) => formatUsdPerShare(value)}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Line
            type="monotone"
            dataKey="eps"
            stroke="#f8fafc"
            strokeWidth={3}
            dot={{ r: 4, fill: "#f8fafc" }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </QuarterlyChartCard>
  );
}
