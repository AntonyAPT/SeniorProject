import { ArrowLeft, BarChart2 } from "lucide-react";
import Link from "next/link";
import {
  TradingViewWidget,
  marketOverviewConfig,
  stockHeatmapConfig,
  stockMarketConfig,
  topStoriesConfig,
} from "@/components/tradingview";

export default function StocksPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                TradingView market heatmap, overviews, and top stories
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Stock Heatmap</h2>
          </div>
          <TradingViewWidget
            widget="stockHeatmap"
            config={stockHeatmapConfig}
            className="h-[520px]"
          />
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TradingViewWidget
              widget="marketOverview"
              config={marketOverviewConfig}
              className="h-[500px]"
            />

            <TradingViewWidget
              widget="stockMarket"
              config={stockMarketConfig}
              className="h-[500px]"
            />

            <TradingViewWidget
              widget="topStories"
              config={topStoriesConfig}
              className="h-[500px]"
            />
          </div>
        </section>

        <p className="text-center text-xs text-slate-600 pb-4">
          Market data and widgets by TradingView · Not financial advice
        </p>
      </div>
    </div>
  );
}