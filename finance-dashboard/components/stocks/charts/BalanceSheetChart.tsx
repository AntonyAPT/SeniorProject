"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QuarterlyChartCard } from "./QuarterlyChartCard";
import { formatMillions, hasMetricData, type QuarterlyChartDatum } from "./shared";

interface BalanceSheetChartProps {
  data: QuarterlyChartDatum[];
}

export function BalanceSheetChart({ data }: BalanceSheetChartProps) {
  const hasData = hasMetricData(data, ["assets", "liabilities", "longTermDebt", "currentDebt"]);

  return (
    <QuarterlyChartCard
      title="Balance Sheet Trend"
      description="Assets, liabilities, and debt values in millions of USD."
      emptyMessage="Balance sheet data is currently unavailable for charting."
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
          <Legend wrapperStyle={{ color: "#cbd5e1" }} />
          <Line type="monotone" dataKey="assets" name="Assets" stroke="#38bdf8" strokeWidth={3} dot={false} />
          <Line
            type="monotone"
            dataKey="liabilities"
            name="Liabilities"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="longTermDebt"
            name="Long-Term Debt"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="currentDebt"
            name="Current Debt"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </QuarterlyChartCard>
  );
}
