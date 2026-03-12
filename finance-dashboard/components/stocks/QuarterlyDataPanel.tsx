"use client";

import { useState } from "react";
import type { QuarterlyFundamentalRow } from "@/types/quarterly";

function parseNumericValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: string | number | null | undefined, fractionDigits = 0) {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(parsed);
}

function formatReportDate(datadate: string) {
  return new Date(datadate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function QuarterlyMetric({
  label,
  unit,
  value,
}: {
  label: string;
  unit?: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-950/40 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
      {unit ? <p className="mt-1 text-xs text-slate-500">{unit}</p> : null}
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

interface QuarterlyDataPanelProps {
  symbol: string;
  rows: QuarterlyFundamentalRow[];
}

function getYearValue(row: QuarterlyFundamentalRow) {
  return row.fyearq === null ? "" : String(row.fyearq);
}

function getQuarterValue(row: QuarterlyFundamentalRow) {
  return row.fqtr === null ? "" : String(row.fqtr);
}

export function QuarterlyDataPanel({ symbol, rows }: QuarterlyDataPanelProps) {
  const latestRow = rows.at(-1) ?? null;
  const years = [...new Set(rows.map((row) => getYearValue(row)).filter(Boolean))].sort(
    (a, b) => Number(b) - Number(a)
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    latestRow ? getYearValue(latestRow) : (years[0] ?? "")
  );
  const availableQuarters = [
    ...new Set(
      rows
        .filter((row) => getYearValue(row) === selectedYear)
        .map((row) => getQuarterValue(row))
        .filter(Boolean)
    ),
  ].sort((a, b) => Number(b) - Number(a));
  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    latestRow && getYearValue(latestRow) === selectedYear
      ? (getQuarterValue(latestRow) || availableQuarters[0] || "")
      : (availableQuarters[0] || "")
  );
  const selectedRow =
    rows.filter(
      (row) => getYearValue(row) === selectedYear && getQuarterValue(row) === selectedQuarter
    ).at(-1) ?? null;

  const handleYearChange = (year: string) => {
    const nextQuarter =
      rows
        .filter((row) => getYearValue(row) === year)
        .map((row) => getQuarterValue(row))
        .filter(Boolean)
        .sort((a, b) => Number(b) - Number(a))[0] ?? "";

    setSelectedYear(year);
    setSelectedQuarter(nextQuarter);
  };

  const handleQuarterChange = (quarter: string) => {
    setSelectedQuarter(quarter);
  };

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 lg:p-6">
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
          <h2 className="text-xl font-semibold text-white">Quarterly Data</h2>
          <p className="text-sm text-slate-400">
            No quarterly fundamentals are currently available for {symbol}.
          </p>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-300">
          quarterly data currently unavailable
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 lg:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Quarterly Data</h2>
          <p className="text-sm text-slate-400">
            Select a reporting year and quarter for {symbol}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Year
            </span>
            <select
              value={selectedYear}
              onChange={(event) => handleYearChange(event.target.value)}
              className="min-w-36 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Quarter
            </span>
            <select
              value={selectedQuarter}
              onChange={(event) => handleQuarterChange(event.target.value)}
              className="min-w-36 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
            >
              {availableQuarters.map((quarter) => (
                <option key={quarter} value={quarter}>
                  Q{quarter}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {selectedRow ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuarterlyMetric
            label="Quarter"
            value={`Q${selectedRow.fqtr ?? "?"} ${selectedRow.fyearq ?? ""}`.trim()}
          />
          <QuarterlyMetric label="Report Date" value={formatReportDate(selectedRow.datadate)} />
          <QuarterlyMetric
            label="Revenue"
            unit="Millions of USD"
            value={
              parseNumericValue(selectedRow.revtq) === null
                ? "Not reported yet"
                : `${formatNumber(selectedRow.revtq)} M USD`
            }
          />
          <QuarterlyMetric
            label="Net Income"
            unit="Millions of USD"
            value={`${formatNumber(selectedRow.niq)} M USD`}
          />
          <QuarterlyMetric
            label="EPS"
            unit="USD per share"
            value={parseNumericValue(selectedRow.epspxq) === null ? "N/A" : `$${formatNumber(selectedRow.epspxq, 2)} / share`}
          />
          <QuarterlyMetric
            label="Assets"
            unit="Millions of USD"
            value={`${formatNumber(selectedRow.atq)} M USD`}
          />
          <QuarterlyMetric
            label="Liabilities"
            unit="Millions of USD"
            value={`${formatNumber(selectedRow.ltq)} M USD`}
          />
          <QuarterlyMetric
            label="Long-Term Debt"
            unit="Millions of USD"
            value={`${formatNumber(selectedRow.dlttq)} M USD`}
          />
          <QuarterlyMetric
            label="Current Debt"
            unit="Millions of USD"
            value={`${formatNumber(selectedRow.dlcq)} M USD`}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm font-medium text-slate-300">
          quarterly data currently unavailable
        </p>
      )}
    </section>
  );
}
