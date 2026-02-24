"use client";

import dynamic from "next/dynamic";
import type {
  MarketOverviewProps,
  StockHeatmapProps,
  StockMarketProps,
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

type TradingViewWidgetProps =
  | {
      widget: "stockHeatmap";
      config: StockHeatmapProps;
      className?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "marketOverview";
      config: MarketOverviewProps;
      className?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "stockMarket";
      config: StockMarketProps;
      className?: string;
      fallback?: ReactNode;
    }
  | {
      widget: "topStories";
      config: TimelineProps;
      className?: string;
      fallback?: ReactNode;
    };

/**
 * Reusable TradingView widget wrapper with consistent styling and SSR-safe loading.
 */
export function TradingViewWidget({
  widget,
  config,
  className = "",
  fallback,
}: TradingViewWidgetProps) {
  return (
    <section
      className={`glass rounded-2xl border border-slate-700/40 bg-slate-900/60 p-3 ${className}`}
    >
      <div className="h-full w-full min-h-[420px]">
        {widget === "stockHeatmap" && <StockHeatmapWidget {...config} />}
        {widget === "marketOverview" && <MarketOverviewWidget {...config} />}
        {widget === "stockMarket" && <StockMarketWidget {...config} />}
        {widget === "topStories" && <TopStoriesWidget {...config} />}
      </div>

      {fallback}
    </section>
  );
}
