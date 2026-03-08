"use client";

import { Check, Minus, Plus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSelectedPortfolio } from "@/app/(main)/contexts/SelectedPortfolioContext";

interface BuyAndWatchlistProps {
  symbol: string;
}

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99999;

/**
 * Buy and watchlist UI for a stock symbol.
 *
 * Current sprint behavior:
 * - Buy action logs to console and shows a toast.
 * - Watchlist action is local UI state only and logs add/remove to console.
 */
export function BuyAndWatchlist({ symbol }: BuyAndWatchlistProps) {
  const [quantity, setQuantity] = useState<number>(MIN_QUANTITY);
  const [quantityInput, setQuantityInput] = useState<string>(String(MIN_QUANTITY));
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const { selectedPortfolioName } = useSelectedPortfolio();

  const portfolioLabel = selectedPortfolioName ?? "Portfolio";

  const syncQuantity = (value: number) => {
    const clamped = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value));
    setQuantity(clamped);
    setQuantityInput(String(clamped));
  };

  const commitInput = () => {
    if (quantityInput.trim() === "") {
      syncQuantity(MIN_QUANTITY);
      return;
    }

    const parsed = Number.parseInt(quantityInput, 10);
    if (Number.isNaN(parsed)) {
      syncQuantity(MIN_QUANTITY);
      return;
    }

    syncQuantity(parsed);
  };

  const handleQuantityChange = (nextValue: string) => {
    if (nextValue === "") {
      setQuantityInput("");
      return;
    }

    // Keep only whole-number digits and cap the field to five digits.
    const digitsOnly = nextValue.replace(/\D/g, "").slice(0, 5);
    if (digitsOnly.length === 0) {
      return;
    }

    const parsed = Number.parseInt(digitsOnly, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    const clamped = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, parsed));
    setQuantity(clamped);
    setQuantityInput(String(clamped));
  };

  const handleBuyClick = () => {
    commitInput();

    const shares = quantityInput.trim() === "" ? MIN_QUANTITY : quantity;
    console.log("Buy order placed:", { ticker: symbol, quantity: shares });

    toast.success(`Added ${shares} share${shares === 1 ? "" : "s"} of ${symbol} to ${portfolioLabel} Portfolio`, {
      description: "Success",
    });

    syncQuantity(MIN_QUANTITY);
  };

  const handleWatchlistToggle = () => {
    const nextState = !isInWatchlist;
    setIsInWatchlist(nextState);

    console.log(nextState ? "Added to watchlist:" : "Removed from watchlist:", {
      ticker: symbol,
    });
  };

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 lg:p-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Add {symbol} to {portfolioLabel} Portfolio</h2>

        <div className="space-y-2">
          <label htmlFor="share-quantity" className="text-sm font-medium text-slate-300">
            Quantity
          </label>
          <div className="flex items-center rounded-2xl border border-slate-600 bg-slate-950/60">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => syncQuantity(quantity - 1)}
              disabled={quantity <= MIN_QUANTITY}
              className="inline-flex h-14 w-16 items-center justify-center rounded-l-2xl text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              <Minus className="h-6 w-6" />
            </button>

            <input
              id="share-quantity"
              value={quantityInput}
              onChange={(event) => handleQuantityChange(event.target.value)}
              onBlur={commitInput}
              inputMode="numeric"
              className="h-14 w-full bg-transparent px-2 text-center text-2xl font-medium text-slate-100 outline-none"
              aria-label="Share quantity"
            />

            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => syncQuantity(quantity + 1)}
              disabled={quantity >= MAX_QUANTITY}
              className="inline-flex h-14 w-16 items-center justify-center rounded-r-2xl text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          <p className="text-xs text-slate-400">Whole numbers only (1 to 99,999 shares per order).</p>
        </div>

        <button
          type="button"
          onClick={handleBuyClick}
          className="h-12 w-full rounded-full bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Add to Portfolio
        </button>

        <button
          type="button"
          onClick={handleWatchlistToggle}
          className={`group flex h-12 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition ${
            isInWatchlist
              ? "border-emerald-500/30 bg-emerald-500 text-slate-950 hover:border-red-500/30 hover:bg-red-500 hover:text-white"
              : "border-slate-600 bg-transparent text-slate-100 hover:border-blue-500 hover:bg-blue-500 hover:text-white"
          }`}
        >
          {isInWatchlist ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />}

          {isInWatchlist ? (
            <>
              <span className="group-hover:hidden">Watching</span>
              <span className="hidden group-hover:inline">Remove?</span>
            </>
          ) : (
            <span>Add to Watchlist</span>
          )}
        </button>
      </div>
    </section>
  );
}
