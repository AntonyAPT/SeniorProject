"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, Loader2, TrendingUp, Building2, CheckCircle } from "lucide-react";
import { useStockSearch } from "@/components/stock-search";
import type { StockSearchResult } from "@/components/stock-search";
import { addToWatchlist } from "../actions";

interface AddStockModalProps {
  onClose: () => void;
  onAdded: (ticker: string, companyName: string) => void;
}

export function AddStockModal({ onClose, onAdded }: AddStockModalProps) {
  const { query, setQuery, results, loading } = useStockSearch();
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mounted]);

  async function handleSelect(result: StockSearchResult) {
    if (adding) return;
    setAdding(result.symbol);
    setError(null);

    try {
      const res = await addToWatchlist(result.symbol, result.description);
      if ("alreadyExists" in res && res.alreadyExists) {
        setError(`${result.symbol} is already in your watchlist`);
      } else {
        setAdded(result.symbol);
        onAdded(result.symbol, result.description);
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to add stock");
    } finally {
      setAdding(null);
    }
  }

  const showEmptyState = query.trim().length > 0 && !loading && results.length === 0;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg glass-strong rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/40">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            placeholder="Search by ticker or company name..."
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {results.map((r) => {
              const isAdding = adding === r.symbol;
              const isAdded = added === r.symbol;
              return (
                <button
                  key={r.symbol}
                  onClick={() => handleSelect(r)}
                  disabled={!!adding}
                  className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0 focus:outline-none focus:bg-slate-700/50 disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      {isAdded
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        : isAdding
                          ? <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                          : <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{r.displaySymbol}</span>
                        <span className="text-slate-300 text-sm truncate">{r.description}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.sector && <span className="text-xs text-slate-500">{r.sector}</span>}
                        {r.sector && r.exchange && <span className="text-slate-600 text-xs">|</span>}
                        {r.exchange && <span className="text-xs text-slate-500">{r.exchange}</span>}
                        {!r.sector && !r.exchange && <span className="text-xs text-slate-600">{r.type}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      {isAdded ? "Added!" : "Add"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {showEmptyState && (
          <div className="flex flex-col items-center gap-2 py-10 text-slate-500">
            <Building2 className="w-6 h-6" />
            <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {/* Idle hint */}
        {!query.trim() && (
          <div className="px-4 py-4 text-xs text-slate-600">
            Try &ldquo;AAPL&rdquo;, &ldquo;Tesla&rdquo;, or &ldquo;NVDA&rdquo;
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
