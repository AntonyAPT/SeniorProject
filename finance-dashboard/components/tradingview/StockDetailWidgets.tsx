"use client";

import { TradingViewWidget } from "./TradingViewWidget";
import {
  companyProfileConfig,
  fundamentalDataConfig,
  symbolOverviewConfig,
} from "./widget-configs";
import type { ReactNode } from "react";

interface StockDetailWidgetsProps {
  /** TradingView-formatted symbol, e.g. "AAPL" or "NASDAQ:AAPL". */
  symbol: string;
  /** Optional UI slot for custom content in the top-left card area. */
  topLeftSlot?: ReactNode;
}

/**
 * Renders the full set of symbol-specific TradingView widgets for a stock detail page.
 *
 * Layout (4/8 split):
 *  - Left column  (4): Buy stock placeholder → Company Profile
 *  - Right column (8): Symbol Overview → Fundamental Data
 */
export function StockDetailWidgets({ symbol, topLeftSlot }: StockDetailWidgetsProps) {
  return (
    <div className="grid grid-cols-12 gap-6 items-stretch">
      {/* ===== Left column (4) ===== */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        {topLeftSlot ? (
          topLeftSlot
        ) : (
          <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/40 flex items-center justify-center min-h-[200px] text-slate-500 text-sm">
            Buy Stock Component (coming soon)
          </div>
        )}

        <div className="flex-1" style={{ zoom: 1.2 }}>
          <TradingViewWidget
            widget="companyProfile"
            config={companyProfileConfig(symbol)}
            className="h-full"
          />
        </div>
      </div>

      {/* ===== Right column (8) ===== */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <TradingViewWidget
          widget="symbolOverview"
          config={symbolOverviewConfig(symbol)}
          className="flex-1"
        />
        <TradingViewWidget
          widget="fundamentalData"
          config={fundamentalDataConfig(symbol)}
          className="flex-1"
        />
      </div>

      {/* symbolInfo widget — kept for reference, currently hidden
      <TradingViewWidget
        widget="symbolInfo"
        config={symbolInfoConfig(symbol)}
        className="flex-none"
        innerClassName="min-h-[160px]"
      />
      */}
    </div>
  );
}
