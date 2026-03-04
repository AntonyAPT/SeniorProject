"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  TrendingUp,
  TrendingDown,
  X,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import type { WatchlistItem } from "./page";
import type { StockQuote } from "@/app/api/stockquote/route";
import { removeFromWatchlist } from "./actions";
import { AddStockModal } from "./components/AddStockModal";

type QuoteMap = Record<string, StockQuote>;

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals);
}

function fmtPrice(n: number) {
  return n > 0 ? `$${fmt(n)}` : "—";
}

// Skeleton row shown while quotes are loading
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 border-b border-slate-800/30 items-center animate-pulse">
      <div className="h-4 w-16 bg-slate-700/60 rounded" />
      <div className="h-4 w-32 bg-slate-700/40 rounded" />
      <div className="h-4 w-20 bg-slate-700/40 rounded ml-auto" />
      <div className="h-4 w-16 bg-slate-700/40 rounded ml-auto" />
      <div className="h-4 w-16 bg-slate-700/40 rounded ml-auto" />
      <div className="h-4 w-4 bg-slate-700/40 rounded ml-auto" />
    </div>
  );
}

interface RowProps {
  item: WatchlistItem;
  quote: StockQuote | undefined;
  onRemove: (id: string) => void;
  removing: boolean;
}

function WatchlistRow({ item, quote, onRemove, removing }: RowProps) {
  const router = useRouter();
  const isPositive = (quote?.changePercent ?? 0) >= 0;

  return (
    <div
      className={`grid grid-cols-[2fr_3fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 border-b border-slate-800/30 items-center group transition-colors hover:bg-slate-800/20 ${
        removing ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Ticker */}
      <button
        onClick={() => router.push(`/stocks/${item.ticker}`)}
        className="flex items-center gap-1.5 font-bold text-white hover:text-blue-400 transition-colors text-left w-fit"
      >
        {item.ticker}
        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>

      {/* Company */}
      <span className="text-slate-400 text-sm truncate">
        {item.companyName || "—"}
      </span>

      {/* Price */}
      <span className="text-right font-mono text-sm text-white">
        {quote ? fmtPrice(quote.currentPrice) : "—"}
      </span>

      {/* Daily change $ */}
      <span
        className={`text-right font-mono text-sm font-medium ${
          !quote ? "text-slate-500" : isPositive ? "text-positive" : "text-negative"
        }`}
      >
        {quote
          ? `${quote.change >= 0 ? "+" : ""}${fmt(quote.change)}`
          : "—"}
      </span>

      {/* Daily change % */}
      <span
        className={`text-right font-mono text-sm font-medium flex items-center justify-end gap-1 ${
          !quote ? "text-slate-500" : isPositive ? "text-positive" : "text-negative"
        }`}
      >
        {quote ? (
          <>
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {`${quote.changePercent >= 0 ? "+" : ""}${fmt(quote.changePercent)}%`}
          </>
        ) : (
          "—"
        )}
      </span>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="ml-auto p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
        aria-label={`Remove ${item.ticker} from watchlist`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function WatchlistPage({ items: initialItems }: { items: WatchlistItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>(initialItems);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchQuotes = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;
    setQuotesLoading(true);
    try {
      const res = await fetch(
        `/api/stockquote?symbols=${tickers.join(",")}`
      );
      const data: StockQuote[] = await res.json();
      const map: QuoteMap = {};
      data.forEach((q) => { map[q.symbol] = q; });
      setQuotes(map);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch quotes", err);
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  // Sync local state when server re-renders with fresh data (e.g. after router.refresh())
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Initial quote fetch
  useEffect(() => {
    const tickers = items.map((i) => i.ticker).filter(Boolean);
    fetchQuotes(tickers);
  }, [items, fetchQuotes]);

  function handleAdded(ticker: string, companyName: string) {
    // Optimistically prepend the new item, then refresh to get the real UUID from the server
    setItems((prev) => [
      { id: `optimistic-${ticker}`, ticker, companyName, addedAt: new Date().toISOString() },
      ...prev,
    ]);
    router.refresh();
  }

  function handleRemove(itemId: string) {
    if (itemId.startsWith("optimistic-")) return; // not yet synced with server
    setRemovingId(itemId);
    startTransition(async () => {
      try {
        await removeFromWatchlist(itemId);
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setQuotes((prev) => {
          const item = items.find((i) => i.id === itemId);
          if (!item) return prev;
          const next = { ...prev };
          delete next[item.ticker];
          return next;
        });
      } catch (err) {
        console.error("Failed to remove item", err);
      } finally {
        setRemovingId(null);
      }
    });
  }

  const tickers = items.map((i) => i.ticker).filter(Boolean);
  const positiveCount = tickers.filter((t) => (quotes[t]?.changePercent ?? 0) >= 0).length;
  const negativeCount = tickers.filter((t) => (quotes[t]?.changePercent ?? 0) < 0).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="px-8 pb-8 pt-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Watchlist</h1>
              <p className="text-slate-400">
                Track your favorite stocks and monitor daily performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh */}
              {items.length > 0 && (
                <button
                  onClick={() => fetchQuotes(tickers)}
                  disabled={quotesLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700/50 transition-all text-sm disabled:opacity-50"
                  aria-label="Refresh quotes"
                >
                  <RefreshCw className={`w-4 h-4 ${quotesLoading ? "animate-spin" : ""}`} />
                  {lastRefreshed
                    ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Refresh"}
                </button>
              )}
              {/* Add stock */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
            </div>
          </div>

          {/* Summary stats */}
          {items.length > 0 && !quotesLoading && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass rounded-xl px-5 py-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Watching</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <div className="glass rounded-xl px-5 py-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Gaining Today</p>
                <p className="text-2xl font-bold text-positive">{positiveCount}</p>
              </div>
              <div className="glass rounded-xl px-5 py-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Declining Today</p>
                <p className="text-2xl font-bold text-negative">{negativeCount}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Table header */}
            {items.length > 0 && (
              <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 border-b border-slate-800/50 text-xs text-slate-500 uppercase tracking-wider">
                <span>Symbol</span>
                <span>Company</span>
                <span className="text-right">Price</span>
                <span className="text-right">Change</span>
                <span className="text-right">Change %</span>
                <span />
              </div>
            )}

            {/* Loading skeletons */}
            {quotesLoading &&
              items.map((item) => <SkeletonRow key={item.id} />)}

            {/* Rows */}
            {!quotesLoading &&
              items.map((item) => (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  quote={quotes[item.ticker]}
                  onRemove={handleRemove}
                  removing={removingId === item.id || isPending}
                />
              ))}

            {/* Empty state */}
            {items.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
                <Eye className="w-10 h-10 opacity-40" />
                <div className="text-center">
                  <p className="text-base font-medium text-slate-400 mb-1">
                    Your watchlist is empty
                  </p>
                  <p className="text-sm">Add stocks to track their daily performance</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add your first stock
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
