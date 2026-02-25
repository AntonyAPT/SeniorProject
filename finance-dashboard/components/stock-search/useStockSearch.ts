"use client";

import { useState, useEffect, useRef } from "react";
import type { StockSearchResult } from "@/app/api/stocksearch/route";

export type { StockSearchResult };

interface UseStockSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: StockSearchResult[];
  loading: boolean;
}

/**
 * Manages stock search state with a 300ms debounce to avoid excessive API calls.
 * Clears results immediately when the query is emptied.
 *
 * @returns query/setQuery for controlled input, results from Finnhub, and loading flag.
 */
export function useStockSearch(): UseStockSearchReturn {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fire the request only after 300ms of inactivity
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocksearch?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return { query, setQuery, results, loading };
}
