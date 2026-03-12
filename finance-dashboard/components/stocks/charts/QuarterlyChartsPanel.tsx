"use client";

import { useState } from "react";
import type { QuarterlyFundamentalRow } from "@/types/quarterly";
import { BalanceSheetChart } from "./BalanceSheetChart";
import { EpsChart } from "./EpsChart";
import { NetIncomeChart } from "./NetIncomeChart";
import { RevenueChart } from "./RevenueChart";
import { buildQuarterlyChartData } from "./shared";

type ChartView = "revenue" | "netIncome" | "eps" | "balanceSheet";

const chartOptions: Array<{ id: ChartView; label: string }> = [
  { id: "revenue", label: "Revenue" },
  { id: "netIncome", label: "Net Income" },
  { id: "eps", label: "EPS" },
  { id: "balanceSheet", label: "Balance Sheet" },
];

interface QuarterlyChartsPanelProps {
  symbol: string;
  rows: QuarterlyFundamentalRow[];
}

export function QuarterlyChartsPanel({ symbol, rows }: QuarterlyChartsPanelProps) {
  const [selectedChart, setSelectedChart] = useState<ChartView>("revenue");
  const chartData = buildQuarterlyChartData(rows);

  const renderedChart =
    selectedChart === "revenue" ? (
      <RevenueChart data={chartData} />
    ) : selectedChart === "netIncome" ? (
      <NetIncomeChart data={chartData} />
    ) : selectedChart === "eps" ? (
      <EpsChart data={chartData} />
    ) : (
      <BalanceSheetChart data={chartData} />
    );

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Quarterly Charts</h2>
          <p className="text-sm text-slate-400">
            Visualize quarterly fundamentals for {symbol}. Select one chart at a time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {chartOptions.map((option) => {
            const isActive = option.id === selectedChart;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedChart(option.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-sky-400 bg-sky-400 text-slate-950"
                    : "border-slate-700 bg-slate-950/60 text-slate-200 hover:border-sky-500 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">{renderedChart}</div>
    </section>
  );
}
