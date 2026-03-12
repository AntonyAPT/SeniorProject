"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QuarterlyChartCard } from "./QuarterlyChartCard";
import { formatMillions, hasMetricData, type QuarterlyChartDatum } from "./shared";

interface NetIncomeChartProps {
  data: QuarterlyChartDatum[];
}

export function NetIncomeChart({ data }: NetIncomeChartProps) {
  const hasData = hasMetricData(data, ["netIncome"]);

  return (
    <QuarterlyChartCard
      title="Net Income Trend"
      description="Quarterly net income in millions of USD."
      emptyMessage="Net income data is currently unavailable for charting."
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
          <Bar dataKey="netIncome" radius={[8, 8, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={`${entry.period}-net-income`}
                fill={entry.netIncome !== null && entry.netIncome < 0 ? "#f97316" : "#22c55e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </QuarterlyChartCard>
  );
}
