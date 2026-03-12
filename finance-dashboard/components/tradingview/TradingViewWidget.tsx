"use client";

import dynamic from "next/dynamic";
import type {
  CompanyProfileProps,
  FundamentalDataProps,
  MarketOverviewProps,
  MiniChartProps,
  StockHeatmapProps,
  StockMarketProps,
  SymbolInfoProps,
  SymbolOverviewProps,
  TechnicalAnalysisProps,
  TimelineProps,
} from "react-ts-tradingview-widgets";
import { ReactNode } from "react";

const StockHeatmapWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.StockHeatmap),
  { ssr: false }
);

const MarketOverviewWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.MarketOverview),
  { ssr: false }
);

const StockMarketWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.StockMarket),
  { ssr: false }
);

const TopStoriesWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.Timeline),
  { ssr: false }
);

const SymbolInfoWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.SymbolInfo),
  { ssr: false }
);

const TechnicalAnalysisWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.TechnicalAnalysis),
  { ssr: false }
);

const FundamentalDataWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.FundamentalData),
  { ssr: false }
);

const CompanyProfileWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.CompanyProfile),
  { ssr: false }
);

const SymbolOverviewWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.SymbolOverview),
  { ssr: false }
);

const MiniChartWidget = dynamic(
  () => import("react-ts-tradingview-widgets").then((m) => m.MiniChart),
  { ssr: false }
);

type TradingViewWidgetProps =
  | {
      widget: "stockHeatmap";
      config: StockHeatmapProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "marketOverview";
      config: MarketOverviewProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "stockMarket";
      config: StockMarketProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "topStories";
      config: TimelineProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "symbolInfo";
      config: SymbolInfoProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "technicalAnalysis";
      config: TechnicalAnalysisProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "fundamentalData";
      config: FundamentalDataProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "companyProfile";
      config: CompanyProfileProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "symbolOverview";
      config: SymbolOverviewProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "miniChart";
      config: MiniChartProps;
      className?: string;
      innerClassName?: string;
      fallback?: ReactNode;
    };

/**
 * Reusable TradingView widget wrapper with consistent styling and SSR-safe loading.
 * Use `innerClassName` to override the default `min-h-[420px]` on the inner container.
 */
export function TradingViewWidget({
  widget,
  config,
  className = "",
  innerClassName = "min-h-[420px]",
  fallback,
}: TradingViewWidgetProps) {
  return (
    <section
      className={`glass rounded-2xl border border-slate-700/40 bg-slate-900/60 p-3 ${className}`}
    >
      <div className={`h-full w-full ${innerClassName}`}>
        {widget === "stockHeatmap" && <StockHeatmapWidget {...config} />}
        {widget === "marketOverview" && <MarketOverviewWidget {...config} />}
        {widget === "stockMarket" && <StockMarketWidget {...config} />}
        {widget === "topStories" && <TopStoriesWidget {...config} />}
        {widget === "symbolInfo" && <SymbolInfoWidget {...config} />}
        {widget === "technicalAnalysis" && <TechnicalAnalysisWidget {...config} />}
        {widget === "fundamentalData" && <FundamentalDataWidget {...config} />}
        {widget === "companyProfile" && <CompanyProfileWidget {...config} />}
        {widget === "symbolOverview" && <SymbolOverviewWidget {...config} />}
        {widget === "miniChart" && <MiniChartWidget {...config} />}
      </div>

      {fallback}
    </section>
  );
}
