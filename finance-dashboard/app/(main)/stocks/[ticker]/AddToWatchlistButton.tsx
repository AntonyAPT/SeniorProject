"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { addToWatchlist, removeFromWatchlist } from "@/app/(main)/watchlist/actions";

interface AddToWatchlistButtonProps {
  ticker: string;
  companyName: string;
  initialItemId: string | null; // null = not in watchlist
}

export function AddToWatchlistButton({
  ticker,
  companyName,
  initialItemId,
}: AddToWatchlistButtonProps) {
  const [itemId, setItemId] = useState<string | null>(initialItemId);
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const inWatchlist = itemId !== null;

  async function handleClick() {
    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(itemId);
        setItemId(null);
      } else {
        const res = await addToWatchlist(ticker, companyName);
        setItemId(res.itemId);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    } catch (err) {
      console.error("Watchlist action failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
        inWatchlist
          ? "bg-slate-700/60 hover:bg-red-500/20 hover:text-red-400 border border-slate-600/50 hover:border-red-500/30 text-slate-300"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : justAdded ? (
        <Check className="w-4 h-4" />
      ) : inWatchlist ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
      {loading
        ? inWatchlist ? "Removing..." : "Adding..."
        : justAdded
        ? "Added!"
        : inWatchlist
        ? "Remove from Watchlist"
        : "Add to Watchlist"}
    </button>
  );
}
