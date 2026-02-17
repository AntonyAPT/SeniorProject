"use client";

import { useEffect, useState, useRef } from "react";
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
  name: string;
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

interface NewsItem {
  title: string;
  published_at: string;
  url: string;
  source: string;
}

interface ChartPoint {
  time: string;
  price: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchStock(ticker: string): Promise<StockData | null> {
  try {
    const res = await fetch(`/api/stock?ticker=${ticker.toUpperCase()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as StockData;
  } catch {
    return null;
  }
}

async function fetchNews(ticker: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`/api/stocknews?ticker=${ticker.toUpperCase()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Generate simulated intraday chart points anchored to real open/current price. */
function buildChartData(open: number, current: number, points = 30): ChartPoint[] {
  const result: ChartPoint[] = [];
  const now = new Date();
  const marketOpen = new Date(now);
  marketOpen.setHours(9, 30, 0, 0);

  const totalMinutes = Math.min(
    (now.getTime() - marketOpen.getTime()) / 60000,
    390
  );
  const step = Math.max(totalMinutes / points, 1);

  let price = open;
  const drift = (current - open) / points;

  for (let i = 0; i <= points; i++) {
    const t = new Date(marketOpen.getTime() + i * step * 60000);
    const noise = (Math.random() - 0.5) * open * 0.004;
    price = i === 0 ? open : i === points ? current : price + drift + noise;

    result.push({
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: parseFloat(price.toFixed(2)),
    });
  }
  return result;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function fmt(n: number | undefined, prefix = ""): string {
  if (n === undefined || n === null) return "—";
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M`;
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

  const [stock, setStock] = useState<StockData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"1D" | "1W" | "1M" | "1Y">("1D");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [stockData, newsData] = await Promise.all([
      fetchStock(ticker),
      fetchNews(ticker),
    ]);
    if (!stockData) {
      setError(`Could not find stock data for "${ticker}". Check the ticker and your API key.`);
    } else {
      setStock(stockData);
      setChart(buildChartData(stockData.open ?? stockData.price, stockData.price));
      setNews(newsData);
    }
    setLoading(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    const stockData = await fetchStock(ticker);
    if (stockData) {
      setStock(stockData);
      setChart(buildChartData(stockData.open ?? stockData.price, stockData.price));
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (ticker) load();
  }, [ticker]);

  // ── Derived values
  const changeAmt = stock
    ? stock.change ?? stock.price - (stock.open ?? stock.price)
    : 0;
  const changePct = stock
    ? stock.change_percent ?? ((changeAmt / (stock.open ?? stock.price)) * 100)
    : 0;
  const isPositive = changeAmt >= 0;

  const chartMin = chart.length
    ? Math.min(...chart.map((c) => c.price)) * 0.999
    : 0;
  const chartMax = chart.length
    ? Math.max(...chart.map((c) => c.price)) * 1.001
    : 0;

  // ── Loading state
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

  // ── Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-3xl">📉</p>
          <p className="text-slate-300 font-medium">{error}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Back nav */}
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
            {/* Ticker badge */}
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{ticker}</h1>
                {stock?.name && (
                  <span className="text-slate-400 text-sm hidden sm:block">
                    {stock.name}
                  </span>
                )}
              </div>
              {stock?.exchange && (
                <p className="text-xs text-slate-500 mt-0.5">{stock.exchange}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Price block */}
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

            {/* Watch button */}
            <button
              onClick={() => setWatched((w) => !w)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                watched
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-700/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700"
              }`}
            >
              {watched ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {watched ? "Watching" : "Watch"}
            </button>

            {/* Refresh */}
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
            <h2 className="text-lg font-semibold">Price Chart</h2>
            <div className="flex gap-1">
              {(["1D", "1W", "1M", "1Y"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
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

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? "#10b981" : "#ef4444"}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? "#10b981" : "#ef4444"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(chart.length / 5)}
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
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-slate-600 text-right mt-2">
            Intraday simulation anchored to live open / current price
          </p>
        </div>

        {/* ══ STATS + NEWS ════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Statistics */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Statistics</h2>
            <div className="space-y-3">
              {[
                { label: "Open", value: stock?.open != null ? `$${stock.open.toFixed(2)}` : "—" },
                { label: "Day High", value: stock?.high != null ? `$${stock.high.toFixed(2)}` : "—" },
                { label: "Day Low", value: stock?.low != null ? `$${stock.low.toFixed(2)}` : "—" },
                { label: "Volume", value: fmt(stock?.volume) },
                { label: "Market Cap", value: stock?.market_cap ? fmt(stock.market_cap, "$") : "—" },
                { label: "P/E Ratio", value: stock?.pe_ratio?.toFixed(1) ?? "—" },
                { label: "Dividend Yield", value: stock?.dividend_yield != null ? `${(stock.dividend_yield * 100).toFixed(2)}%` : "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0"
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
            <div className="space-y-4">
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
                      <span className="text-xs text-slate-500">
                        {timeAgo(item.published_at)}
                      </span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Footer note */}
        <p className="text-center text-xs text-slate-600 pb-4">
          Data provided by API-Ninjas · Prices delayed · Not financial advice
        </p>
      </div>
    </div>
  );
}