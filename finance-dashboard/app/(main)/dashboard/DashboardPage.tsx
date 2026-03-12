"use client";

import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardWatchlistItem } from "./page";
import type { StockQuote } from "@/app/api/stockquote/route";
import { PortfolioPanel } from "./PortfolioPanel";
import type { PortfolioItem } from "./PortfolioPanel";

export default function DashboardPage({
  watchlistItems,
  portfolioItems,
}: {
  watchlistItems: DashboardWatchlistItem[];
  portfolioItems: PortfolioItem[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});

  useEffect(() => {
    const tickers = watchlistItems.map((i) => i.ticker).filter(Boolean);
    if (tickers.length === 0) return;
    fetch(`/api/stockquote?symbols=${tickers.join(",")}`)
      .then((r) => r.json())
      .then((data: StockQuote[]) => {
        const map: Record<string, StockQuote> = {};
        data.forEach((q) => { map[q.symbol] = q; });
        setQuotes(map);
      })
      .catch(console.error);
  }, [watchlistItems]);

  const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  const t = search.trim().toUpperCase();
  if (t) router.push(`/stocks/${t}`);
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Search Bar */}
      <div className="px-8 pt-6 pb-4">
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stocks, predictions..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      <main className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-slate-400">
              Monitor your predictions and portfolio performance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Portfolio Value"
              value="$124,532"
              change="+12.5%"
              isPositive={true}
            />
            <StatCard
              label="Today's P&L"
              value="$2,847"
              change="+2.3%"
              isPositive={true}
            />
            <StatCard
              label="Active Predictions"
              value="23"
              change="+5"
              isPositive={true}
            />
            <StatCard
              label="Accuracy Rate"
              value="78.4%"
              change="+3.2%"
              isPositive={true}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio Panel */}
            <PortfolioPanel portfolioItems={portfolioItems} />

            {/* AI Predictions Panel */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">AI Predictions</h2>
              <div className="space-y-4">
                <PredictionCard
                  ticker="AAPL"
                  prediction="BUY"
                  confidence={87}
                  change="+2.4%"
                  isPositive={true}
                />
                <PredictionCard
                  ticker="TSLA"
                  prediction="HOLD"
                  confidence={72}
                  change="+0.8%"
                  isPositive={true}
                />
                <PredictionCard
                  ticker="NVDA"
                  prediction="BUY"
                  confidence={91}
                  change="+3.2%"
                  isPositive={true}
                />
                <PredictionCard
                  ticker="AMZN"
                  prediction="SELL"
                  confidence={68}
                  change="-1.2%"
                  isPositive={false}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <ActivityItem
                  action="New prediction generated"
                  ticker="AAPL"
                  time="2 minutes ago"
                  type="prediction"
                />
                <ActivityItem
                  action="Portfolio updated"
                  ticker="TSLA"
                  time="1 hour ago"
                  type="update"
                />
                <ActivityItem
                  action="Alert triggered"
                  ticker="NVDA"
                  time="3 hours ago"
                  type="alert"
                />
                <ActivityItem
                  action="New prediction generated"
                  ticker="AMZN"
                  time="5 hours ago"
                  type="prediction"
                />
              </div>
            </div>

            {/* Watchlist */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Watchlist</h2>
                <button
                  onClick={() => router.push("/watchlist")}
                  className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {watchlistItems.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">
                    No stocks in your watchlist yet
                  </p>
                ) : (
                  watchlistItems.map((item) => {
                    const quote = quotes[item.ticker];
                    const isPositive = (quote?.changePercent ?? 0) >= 0;
                    return (
                      <WatchlistItem
                        key={item.ticker}
                        ticker={item.ticker}
                        price={quote ? `$${quote.currentPrice.toFixed(2)}` : "—"}
                        change={
                          quote
                            ? `${isPositive ? "+" : ""}${quote.changePercent.toFixed(2)}%`
                            : "—"
                        }
                        isPositive={isPositive}
                        onClick={() => router.push(`/stocks/${item.ticker}`)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  change,
  isPositive,
}: {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-6 card-hover">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold">{value}</h3>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? "text-positive" : "text-negative"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
    </div>
  );
}

// Prediction Card Component
function PredictionCard({
  ticker,
  prediction,
  confidence,
  change,
  isPositive,
}: {
  ticker: string;
  prediction: string;
  confidence: number;
  change: string;
  isPositive: boolean;
}) {
  const getPredictionClass = (pred: string) => {
    if (pred === "BUY") return "text-positive bg-emerald-500/10";
    if (pred === "SELL") return "text-negative bg-red-500/10";
    return "text-neutral bg-amber-500/10";
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 hover:bg-slate-800/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold">{ticker}</span>
        <span
          className={`text-sm ${
            isPositive ? "text-positive" : "text-negative"
          }`}
        >
          {change}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${getPredictionClass(
            prediction
          )}`}
        >
          {prediction}
        </span>
        <span className="text-xs text-slate-400">{confidence}% confidence</span>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({
  action,
  ticker,
  time,
  type,
}: {
  action: string;
  ticker: string;
  time: string;
  type: string;
}) {
  const getIcon = () => {
    if (type === "prediction")
      return <BarChart3 className="w-4 h-4 text-positive" />;
    if (type === "alert")
      return <AlertCircle className="w-4 h-4 text-neutral" />;
    return <TrendingUp className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all">
      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{action}</p>
        <p className="text-xs text-slate-400">
          {ticker} • {time}
        </p>
      </div>
    </div>
  );
}

// Watchlist Item Component
function WatchlistItem({
  ticker,
  price,
  change,
  isPositive,
  onClick,
}: {
  ticker: string;
  price: string;
  change: string;
  isPositive: boolean;
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer">
      <div>
        <p className="font-medium">{ticker}</p>
        <p className="text-sm text-slate-400">{price}</p>
      </div>
      <span
        className={`text-sm font-medium ${
          isPositive ? "text-positive" : "text-negative"
        }`}
      >
        {change}
      </span>
    </div>
  );
}
