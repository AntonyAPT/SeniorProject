"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Building2, TrendingUp } from "lucide-react";
import { useStockSearch } from "./useStockSearch";
import type { StockSearchResult } from "./useStockSearch";

// ===== Result Row =====

interface ResultRowProps {
  result: StockSearchResult;
  onSelect: (symbol: string) => void;
}

function ResultRow({ result, onSelect }: ResultRowProps) {
  return (
    <button
      onClick={() => onSelect(result.symbol)}
      className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0 focus:outline-none focus:bg-slate-700/50"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 mt-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{result.displaySymbol}</span>
            <span className="text-slate-300 text-sm truncate">{result.description}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {result.sector && (
              <span className="text-xs text-slate-500">{result.sector}</span>
            )}
            {result.sector && result.exchange && (
              <span className="text-slate-600 text-xs">·</span>
            )}
            {result.exchange && (
              <span className="text-xs text-slate-500">{result.exchange}</span>
            )}
            {!result.sector && !result.exchange && (
              <span className="text-xs text-slate-600">{result.type}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ===== Modal =====

interface SearchModalProps {
  onClose: () => void;
}

function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, loading } = useStockSearch();

  // Auto-focus the input when the modal mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSelect(symbol: string) {
    onClose();
    router.push(`/stocks/${symbol}`);
  }

  const showEmptyState = query.trim().length > 0 && !loading && results.length === 0;

  return (
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

        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/40">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticker or company name..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {results.map((r) => (
              <ResultRow key={r.symbol} result={r} onSelect={handleSelect} />
            ))}
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
    </div>
  );
}

// ===== Trigger + Exported Component =====

/**
 * Renders a centered search trigger bar on the Stocks page. Clicking it opens
 * a modal overlay where users can search stocks by ticker or company name.
 * Selecting a result navigates to the stock's detail page at /stocks/[ticker].
 */
export function StockSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 w-full max-w-md px-4 py-3 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/70 hover:bg-slate-800/80 transition-all text-slate-400 hover:text-slate-300 group"
          aria-label="Open stock search"
        >
          <Search className="w-4 h-4 shrink-0 group-hover:text-blue-400 transition-colors" />
          <span className="text-sm">Search stocks...</span>
        </button>
      </div>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  );
}
