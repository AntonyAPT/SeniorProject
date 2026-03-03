"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import {
  companyProfileConfig,
  fundamentalDataConfig,
  symbolInfoConfig,
  symbolOverviewConfig,
} from "./widget-configs";

interface StockDetailWidgetsProps {
  /** TradingView-formatted symbol, e.g. "AAPL" or "NASDAQ:AAPL". */
  symbol: string;
}

/**
 * Renders the full set of symbol-specific TradingView widgets for a stock detail page.
 *
 * Layout:
 *  - Left column (wider): Symbol Info → Symbol Overview
 *  - Right column: Company Profile → Fundamental Data
 */
export function StockDetailWidgets({ symbol }: StockDetailWidgetsProps) {
  return (
    <div className="grid grid-cols-12 gap-6 items-stretch">
      {/* ===== Left column ===== */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <TradingViewWidget
          widget="symbolInfo"
          config={symbolInfoConfig(symbol)}
          className="flex-none"
          innerClassName="min-h-[160px]"
        />
        <TradingViewWidget
          widget="symbolOverview"
          config={symbolOverviewConfig(symbol)}
          className="flex-1"
        />
      </div>

      {/* ===== Right column ===== */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <TradingViewWidget
          widget="companyProfile"
          config={companyProfileConfig(symbol)}
          className="flex-1"
        />
        <TradingViewWidget
          widget="fundamentalData"
          config={fundamentalDataConfig(symbol)}
          className="flex-1"
        />
      </div>
    </div>
  );
}
