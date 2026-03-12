import type { QuarterlyFundamentalRow } from "@/types/quarterly";

export interface QuarterlyChartDatum {
  period: string;
  reportDate: string;
  year: number | null;
  quarter: string;
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  assets: number | null;
  liabilities: number | null;
  longTermDebt: number | null;
  currentDebt: number | null;
}

type TooltipValue = string | number | readonly (string | number)[] | null | undefined;
type NumericLikeValue = string | number | null | undefined;

export function parseNumericValue(value: NumericLikeValue) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildQuarterlyChartData(rows: QuarterlyFundamentalRow[]): QuarterlyChartDatum[] {
  return rows.map((row) => {
    const quarter = row.fqtr === null ? "?" : String(row.fqtr);

    return {
      period: `Q${quarter} ${row.fyearq ?? ""}`.trim(),
      reportDate: row.datadate,
      year: row.fyearq,
      quarter,
      revenue: parseNumericValue(row.revtq),
      netIncome: parseNumericValue(row.niq),
      eps: parseNumericValue(row.epspxq),
      assets: parseNumericValue(row.atq),
      liabilities: parseNumericValue(row.ltq),
      longTermDebt: parseNumericValue(row.dlttq),
      currentDebt: parseNumericValue(row.dlcq),
    };
  });
}

export function hasMetricData(
  data: QuarterlyChartDatum[],
  keys: Array<keyof Pick<
    QuarterlyChartDatum,
    "revenue" | "netIncome" | "eps" | "assets" | "liabilities" | "longTermDebt" | "currentDebt"
  >>
) {
  return data.some((row) => keys.some((key) => row[key] !== null));
}

function parseTooltipValue(value: TooltipValue) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    const firstValue = value[0];
    return parseNumericValue(firstValue);
  }

  if (typeof value === "string" || typeof value === "number") {
    return parseNumericValue(value);
  }

  return null;
}

export function formatMillions(value: TooltipValue) {
  const parsed = parseTooltipValue(value);

  if (parsed === null) {
    return "N/A";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(parsed)} M USD`;
}

export function formatUsdPerShare(value: TooltipValue) {
  const parsed = parseTooltipValue(value);

  if (parsed === null) {
    return "N/A";
  }

  return `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed)} / share`;
}
