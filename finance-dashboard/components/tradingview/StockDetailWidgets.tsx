"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import {
  companyProfileConfig,
  fundamentalDataConfig,
  symbolInfoConfig,
  symbolOverviewConfig,
  technicalAnalysisConfig,
} from "./widget-configs";

interface StockDetailWidgetsProps {
  /** TradingView-formatted symbol, e.g. "AAPL" or "NASDAQ:AAPL". */
  symbol: string;
}

/**
 * Renders the full set of symbol-specific TradingView widgets for a stock detail page.
 *
 * Layout:
 *  - Left column (wider): Symbol Info → Company Profile
 *  - Right column: Technical Analysis → Fundamental Data
 *  - Full-width below: Symbol Overview
 */
export function StockDetailWidgets({ symbol }: StockDetailWidgetsProps) {
  return (
    <div className="space-y-6">
      {/* ===== Two-column widget grid ===== */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <TradingViewWidget
            widget="symbolInfo"
            config={symbolInfoConfig(symbol)}
            className="min-h-[160px] flex-none"
          />
          <TradingViewWidget
            widget="companyProfile"
            config={companyProfileConfig(symbol)}
            className="flex-1"
          />
        </div>

        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <TradingViewWidget
            widget="technicalAnalysis"
            config={technicalAnalysisConfig(symbol)}
            className="flex-1"
          />
          <TradingViewWidget
            widget="fundamentalData"
            config={fundamentalDataConfig(symbol)}
            className="flex-1"
          />
        </div>
      </div>

      {/* ===== Full-width Symbol Overview ===== */}
      <TradingViewWidget
        widget="symbolOverview"
        config={symbolOverviewConfig(symbol)}
        className="h-[420px]"
      />
    </div>
  );
}
