"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  BarChart2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockQuote {
  ticker:         string;
  name:           string;
  price:          number;
  change:         number;
  change_percent: number;
  volume?:        number;
  market_cap?:    number;
}

// ─── Top tickers to show in the grid ─────────────────────────────────────────

const TOP_TICKERS = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL",
  "META", "TSLA", "JPM", "V", "NFLX", "AMD", "BRK-B",
];

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(`/api/stock?ticker=${ticker}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.error ? null : (data as StockQuote);
  } catch {
    return null;
  }
}

async function fetchScreener(
  type: "gainers" | "losers",
  count = 6
): Promise<StockQuote[]> {
  try {
    const res = await fetch(`/api/stockscreener?type=${type}&count=${count}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtCap(n: number | undefined): string {
  if (n == null) return "";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

// ─── QuoteCard ────────────────────────────────────────────────────────────────

interface QuoteCardProps {
  q:       StockQuote;
  onClick: () => void;
}

function QuoteCard({ q, onClick }: QuoteCardProps) {
  const isPositive = q.change_percent >= 0;

  return (
    <div
      onClick={onClick}
      className="glass rounded-2xl p-5 cursor-pointer hover:bg-slate-800/60 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 pr-2">
          <p className="font-bold text-base group-hover:text-blue-300 transition-colors">
            {q.ticker}
          </p>
          <p className="text-xs text-slate-500 truncate">{q.name}</p>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {q.change_percent?.toFixed(2)}%
        </span>
      </div>

      <p className="text-2xl font-bold tracking-tight mb-1">
        ${q.price?.toFixed(2) ?? "—"}
      </p>

      <div
        className={`flex items-center gap-1 text-xs font-medium ${
          isPositive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {isPositive ? "+" : ""}
        {q.change?.toFixed(2)} today
      </div>

      {q.market_cap != null && (
        <p className="text-xs text-slate-600 mt-2">
          Mkt Cap {fmtCap(q.market_cap)}
        </p>
      )}
    </div>
  );
}

// ─── MoverRow ─────────────────────────────────────────────────────────────────

interface MoverRowProps {
  q:       StockQuote;
  rank:    number;
  onClick: () => void;
}

function MoverRow({ q, rank, onClick }: MoverRowProps) {
  const isPositive = q.change_percent >= 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-all group"
    >
      <span className="text-slate-600 text-xs w-4 shrink-0">{rank}</span>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm group-hover:text-blue-300 transition-colors">
          {q.ticker}
        </p>
        <p className="text-xs text-slate-500 truncate">{q.name}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">${q.price?.toFixed(2)}</p>
        <p
          className={`text-xs font-medium ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {q.change_percent?.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-1">
          <div className="h-4 w-12 bg-slate-700/60 rounded" />
          <div className="h-3 w-20 bg-slate-700/40 rounded" />
        </div>
        <div className="h-6 w-14 bg-slate-700/40 rounded-lg" />
      </div>
      <div className="h-7 w-24 bg-slate-700/60 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-700/40 rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="h-3 w-4 bg-slate-700/40 rounded" />
      <div className="flex-1 space-y-1">
        <div className="h-4 w-16 bg-slate-700/60 rounded" />
        <div className="h-3 w-28 bg-slate-700/40 rounded" />
      </div>
      <div className="space-y-1 text-right">
        <div className="h-4 w-16 bg-slate-700/60 rounded" />
        <div className="h-3 w-10 bg-slate-700/40 rounded ml-auto" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StocksPage() {
  const router = useRouter();

  const [topStocks,   setTopStocks]   = useState<StockQuote[]>([]);
  const [gainers,     setGainers]     = useState<StockQuote[]>([]);
  const [losers,      setLosers]      = useState<StockQuote[]>([]);
  const [loadingTop,  setLoadingTop]  = useState(true);
  const [loadingMov,  setLoadingMov]  = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadTop = async () => {
    setLoadingTop(true);
    const results = await Promise.all(TOP_TICKERS.map(fetchQuote));
    setTopStocks(results.filter((q): q is StockQuote => q !== null));
    setLoadingTop(false);
  };

  const loadMovers = async () => {
    setLoadingMov(true);
    const [g, l] = await Promise.all([
      fetchScreener("gainers", 6),
      fetchScreener("losers",  6),
    ]);
    setGainers(g);
    setLosers(l);
    setLoadingMov(false);
  };

  const loadAll = async () => {
    await Promise.all([loadTop(), loadMovers()]);
    setLastUpdated(new Date());
  };

  useEffect(() => { loadAll(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = search.trim().toUpperCase();
    if (t) router.push(`/stocks/${t}`);
  };

  const goTo = (ticker: string) => router.push(`/stocks/${ticker}`);

  const filteredTop = search.trim()
    ? topStocks.filter(
        (q) =>
          q.ticker.includes(search.toUpperCase()) ||
          q.name.toLowerCase().includes(search.toLowerCase())
      )
    : topStocks;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header */}
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
                Live prices · Daily movers
                {lastUpdated && (
                  <span className="ml-2 text-slate-600">
                    · Updated{" "}
                    {lastUpdated.toLocaleTimeString([], {
                      hour:   "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || loadingTop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Search */}
        <form onSubmit={handleSearch} className="max-w-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker or name… press Enter to open"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
        </form>

        {/* ── Top Stocks Grid */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Top Stocks</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {loadingTop ? (
              Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredTop.length === 0 ? (
              <p className="col-span-full text-slate-500 text-sm py-8 text-center">
                No stocks match &ldquo;{search}&rdquo; — press Enter to search
              </p>
            ) : (
              filteredTop.map((q) => (
                <QuoteCard
                  key={q.ticker}
                  q={q}
                  onClick={() => goTo(q.ticker)}
                />
              ))
            )}
          </div>
        </section>

        {/* ── Gainers + Losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Gainers */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold">Top Gainers</h2>
              <span className="text-xs text-slate-500 ml-auto">Today</span>
            </div>

            <div className="divide-y divide-slate-700/30">
              {loadingMov ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : gainers.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">
                  No data available
                </p>
              ) : (
                gainers.map((q, i) => (
                  <MoverRow
                    key={q.ticker}
                    q={q}
                    rank={i + 1}
                    onClick={() => goTo(q.ticker)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Losers */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold">Top Losers</h2>
              <span className="text-xs text-slate-500 ml-auto">Today</span>
            </div>

            <div className="divide-y divide-slate-700/30">
              {loadingMov ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : losers.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">
                  No data available
                </p>
              ) : (
                losers.map((q, i) => (
                  <MoverRow
                    key={q.ticker}
                    q={q}
                    rank={i + 1}
                    onClick={() => goTo(q.ticker)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 pb-4">
          Prices via Finnhub &amp; Yahoo Finance · Delayed 15 min · Not financial advice
        </p>
      </div>
    </div>
  );
}