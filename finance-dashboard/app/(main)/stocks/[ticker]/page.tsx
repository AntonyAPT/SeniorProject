"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Check,
  ArrowLeft,
  RefreshCw,
  Newspaper,
  BarChart2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockData {
  ticker: string;
  name?: string;
  price: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  change?: number;
  change_percent?: number;
  exchange?: string;
  currency?: string;
}

interface HistoricalPoint {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number; // unix timestamp
}

interface ChartPoint {
  time: string;
  price: number;
}

type Range = "1D" | "1W" | "1M" | "1Y";

// ─── Label formatters per range ───────────────────────────────────────────────

function formatTime(unixSec: number, range: Range): string {
  const d = new Date(unixSec * 1000);
  if (range === "1D") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (range === "1W") {
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }
  if (range === "1M") {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  // 1Y
  return d.toLocaleDateString([], { month: "short", year: "2-digit" });
}

// ─── Tick interval so XAxis is never crowded ──────────────────────────────────

const TICK_COUNT: Record<Range, number> = {
  "1D": 6,
  "1W": 7,
  "1M": 6,
  "1Y": 8,
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchStock(ticker: string): Promise<StockData | null> {
  try {
    const res = await fetch(`/api/stock?ticker=${ticker}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.error ? null : (data as StockData);
  } catch {
    return null;
  }
}

async function fetchHistorical(ticker: string, range: Range): Promise<ChartPoint[]> {
  try {
    const res = await fetch(`/api/stockhistorical?ticker=${ticker}&range=${range}`);
    if (!res.ok) return [];
    const data: HistoricalPoint[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    // Sort ascending by time, map close price
    return data
      .slice()
      .sort((a, b) => a.time - b.time)
      .map((d) => ({
        time: formatTime(d.time, range),
        price: parseFloat(d.close.toFixed(2)),
      }));
  } catch {
    return [];
  }
}

interface NewsItem {
  title: string;
  published_at: string;
  url: string;
  source: string;
}

async function fetchNews(ticker: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`/api/stocknews?ticker=${ticker}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function fmt(n: number | undefined, prefix = ""): string {
  if (n === undefined || n === null) return "—";
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6)  return `${prefix}${(n / 1e6).toFixed(2)}M`;
  return `${prefix}${n.toLocaleString()}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="font-semibold text-white">${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StockPage() {
  const params = useParams();
  const ticker = (
    Array.isArray(params?.ticker) ? params.ticker[0] : params?.ticker ?? ""
  ).toUpperCase();

  const [stock,      setStock]      = useState<StockData | null>(null);
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [chart,      setChart]      = useState<ChartPoint[]>([]);
  const [range,      setRange]      = useState<Range>("1D");
  const [watched,    setWatched]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [chartLoad,  setChartLoad]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Initial load: stock price + news in parallel
  useEffect(() => {
    if (!ticker) return;
    (async () => {
      setLoading(true);
      setError(null);
      const [stockData, newsData] = await Promise.all([
        fetchStock(ticker),
        fetchNews(ticker),
      ]);
      if (!stockData) {
        setError(`Could not find data for "${ticker}". Check the ticker symbol.`);
      } else {
        setStock(stockData);
        setNews(newsData);
      }
      setLoading(false);
    })();
  }, [ticker]);

  // ── Load chart whenever range or stock changes
  useEffect(() => {
    if (!ticker || !stock) return;
    (async () => {
      setChartLoad(true);
      const points = await fetchHistorical(ticker, range);
      setChart(points);
      setChartLoad(false);
    })();
  }, [ticker, range, stock]);

  // ── Refresh current price
  const refresh = useCallback(async () => {
    setRefreshing(true);
    const stockData = await fetchStock(ticker);
    if (stockData) setStock(stockData);
    setRefreshing(false);
  }, [ticker]);

  // ── Derived values
  const changeAmt = stock
    ? stock.change ?? stock.price - (stock.open ?? stock.price)
    : 0;
  const changePct = stock
    ? stock.change_percent ?? (changeAmt / (stock.open ?? stock.price)) * 100
    : 0;
  const isPositive = changeAmt >= 0;

  const chartMin = chart.length ? Math.min(...chart.map((c) => c.price)) * 0.998 : 0;
  const chartMax = chart.length ? Math.max(...chart.map((c) => c.price)) * 1.002 : 0;
  const tickInterval = Math.max(1, Math.floor(chart.length / (TICK_COUNT[range] - 1)));

  // ── Chart colour follows today's change
  const strokeColor = isPositive ? "#10b981" : "#ef4444";

  // ── Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading {ticker}…</p>
        </div>
      </div>
    );
  }

  // ── Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-3xl">📉</p>
          <p className="text-slate-300 font-medium">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Back nav */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div className="glass rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{ticker}</h1>
                {stock?.name && (
                  <span className="text-slate-400 text-sm hidden sm:block">{stock.name}</span>
                )}
              </div>
              {stock?.exchange && (
                <p className="text-xs text-slate-500 mt-0.5">{stock.exchange}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-bold tracking-tight">
                {stock?.currency === "USD" || !stock?.currency ? "$" : ""}
                {stock?.price?.toFixed(2) ?? "—"}
              </p>
              <div
                className={`flex items-center justify-end gap-1 text-sm font-medium mt-0.5 ${
                  isPositive ? "text-positive" : "text-negative"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {isPositive ? "+" : ""}
                {changeAmt.toFixed(2)} ({isPositive ? "+" : ""}
                {changePct.toFixed(2)}%)
              </div>
            </div>

            <button
              onClick={() => setWatched((w) => !w)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                watched
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-700/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700"
              }`}
            >
              {watched ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {watched ? "Watching" : "Watch"}
            </button>

            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
              title="Refresh price"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ══ CHART ═══════════════════════════════════════════════════════════ */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Price Chart</h2>
              {chartLoad && (
                <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
              )}
            </div>
            <div className="flex gap-1">
              {(["1D", "1W", "1M", "1Y"] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  disabled={chartLoad}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                    range === r
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:bg-slate-800/50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 relative">
            {chartLoad && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-xl z-10">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            )}

            {chart.length === 0 && !chartLoad ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No historical data available for this range.
                <br />
                <span className="text-xs mt-1 block text-center text-slate-600">
                  (Historical data requires a premium API-Ninjas subscription)
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={tickInterval}
                  />
                  <YAxis
                    domain={[chartMin, chartMax]}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={strokeColor}
                    strokeWidth={2}
                    fill="url(#priceGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    isAnimationActive={!chartLoad}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <p className="text-xs text-slate-600 text-right mt-2">
            Historical data via API-Ninjas · Prices delayed 15 min (free tier)
          </p>
        </div>

        {/* ══ STATS + NEWS ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Statistics */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Statistics</h2>
            <div className="space-y-0">
              {[
                { label: "Open",           value: stock?.open  != null ? `$${stock.open.toFixed(2)}`  : "—" },
                { label: "Day High",       value: stock?.high  != null ? `$${stock.high.toFixed(2)}`  : "—" },
                { label: "Day Low",        value: stock?.low   != null ? `$${stock.low.toFixed(2)}`   : "—" },
                { label: "Volume",         value: fmt(stock?.volume) },
                { label: "Market Cap",     value: stock?.market_cap     ? fmt(stock.market_cap, "$")               : "—" },
                { label: "P/E Ratio",      value: stock?.pe_ratio       ? stock.pe_ratio.toFixed(1)                : "—" },
                { label: "Dividend Yield", value: stock?.dividend_yield != null
                    ? `${(stock.dividend_yield * 100).toFixed(2)}%`
                    : "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2.5 border-b border-slate-700/30 last:border-0"
                >
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Company News */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Newspaper className="w-4 h-4 text-slate-400" />
              <h2 className="text-lg font-semibold">Company News</h2>
            </div>
            <div className="space-y-3">
              {news.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No recent news found.</p>
              ) : (
                news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl hover:bg-slate-800/60 transition-all group"
                  >
                    <p className="text-sm font-medium group-hover:text-blue-300 transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-slate-500">{item.source}</span>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-xs text-slate-500">{timeAgo(item.published_at)}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 pb-4">
          Data provided by API-Ninjas · Not financial advice
        </p>
      </div>
    </div>
  );
}