import { BarChart2 } from "lucide-react";
import {
  TradingViewWidget,
  marketOverviewConfig,
  stockHeatmapConfig,
  stockMarketConfig,
  topStoriesConfig,
} from "@/components/tradingview";
import { StockSearch } from "@/components/stock-search";

export default function StocksPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Stock Market heatmap, overviews, and top stories
          </p>
        </div>

        <StockSearch />

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Stock Heatmap</h2>
          </div>
          <TradingViewWidget
            widget="stockHeatmap"
            config={stockHeatmapConfig}
            className="h-[530px]"
          />
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TradingViewWidget
              widget="marketOverview"
              config={marketOverviewConfig}
              className="h-[530px]"
            />

            <TradingViewWidget
              widget="stockMarket"
              config={stockMarketConfig}
              className="h-[530px]"
            />

            <TradingViewWidget
              widget="topStories"
              config={topStoriesConfig}
              className="h-[530px]"
            />
          </div>
        </section>

      </div>
    </div>
  );
}