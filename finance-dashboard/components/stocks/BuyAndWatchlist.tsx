"use client";

import { Check, Minus, Plus, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSelectedPortfolio } from "@/app/(main)/contexts/SelectedPortfolioContext";
import { addStockToPortfolio } from "@/app/(main)/actions/portfolio";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlistStatus,
} from "@/app/(main)/watchlist/actions";

interface BuyAndWatchlistProps {
  symbol: string;
}

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99999;

/**
 * Buy and watchlist UI for a stock symbol.
 */
export function BuyAndWatchlist({ symbol }: BuyAndWatchlistProps) {
  const [quantity, setQuantity] = useState<number>(MIN_QUANTITY); 
  const [quantityInput, setQuantityInput] = useState<string>(String(MIN_QUANTITY));
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isWatchlistSubmitting, setIsWatchlistSubmitting] = useState<boolean>(false);
  const { selectedPortfolioId, selectedPortfolioName } = useSelectedPortfolio();

  useEffect(() => {
    getWatchlistStatus(symbol).then(({ inWatchlist, itemId }) => {
      setIsInWatchlist(inWatchlist);
      setWatchlistItemId(itemId);
    });
  }, [symbol]);

  const portfolioLabel = selectedPortfolioName ?? "Portfolio";

  const syncQuantity = (value: number) => {
    const clamped = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value));
    setQuantity(clamped);
    setQuantityInput(String(clamped));
  };

  // quantity states get synced at commit points (user clicks the button or clicks anywhere else in the page)
  const commitInput = () => {
    if (quantityInput.trim() === "") {
      syncQuantity(MIN_QUANTITY);
      return;
    }

    // ignored trailing non-numeric characters: "5abc" -> 5
    const parsed = Number.parseInt(quantityInput, 10);
    if (Number.isNaN(parsed)) {
      syncQuantity(MIN_QUANTITY);
      return;
    }

    syncQuantity(parsed);
  };

  const handleQuantityChange = (nextValue: string) => {
    // Empty string is allowed through to quantityInput so the user can clear the field mid-edit
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

  const handleBuyClick = async () => {
    commitInput();

    if (!selectedPortfolioId) {
      toast.error("No portfolio selected");
      return;
    }

    const shares = quantityInput.trim() === "" ? MIN_QUANTITY : quantity;

    setIsSubmitting(true);
    try {
      const result = await addStockToPortfolio(selectedPortfolioId, symbol, shares);

      if (result.error) {
        toast.error(result.error);
      } else {
        const price = result.data!.buy_price;
        toast.success(
          `Added ${shares} share${shares === 1 ? "" : "s"} of ${symbol} at $${price.toFixed(2)}`,
          { description: `Added to ${portfolioLabel} Portfolio` }
        );
        syncQuantity(MIN_QUANTITY);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWatchlistToggle = async () => {
    setIsWatchlistSubmitting(true);
    try {
      if (isInWatchlist && watchlistItemId) {
        await removeFromWatchlist(watchlistItemId);
        setIsInWatchlist(false);
        setWatchlistItemId(null);
        toast.success(`Removed ${symbol} from watchlist`);
      } else {
        const result = await addToWatchlist(symbol, symbol);
        setIsInWatchlist(true);
        setWatchlistItemId(result.itemId);
        toast.success(`Added ${symbol} to watchlist`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Watchlist update failed");
    } finally {
      setIsWatchlistSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 lg:p-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-300">
          Add <span className="font-bold text-white">{symbol}</span> to <span className="font-bold text-white">{portfolioLabel}</span> Portfolio
        </h2>

        <div className="space-y-2">
          <label htmlFor="share-quantity" className="mt-5 mb-1.5 block text-sm font-medium text-slate-300">
            Quantity (1 to 99,999 shares per order)
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
        </div>

        <button
          type="button"
          onClick={handleBuyClick}
          disabled={isSubmitting} // when true, browser blocks onClick from firing
          className="h-12 w-full rounded-full bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Adding..." : "Add to Portfolio"}
        </button>

        <button
          type="button"
          onClick={handleWatchlistToggle}
          disabled={isWatchlistSubmitting}
          className={`group flex h-12 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isInWatchlist
              ? "border-emerald-500/30 bg-emerald-500 text-slate-950 hover:border-red-500/30 hover:bg-red-500 hover:text-white"
              : "border-slate-600 bg-transparent text-slate-100 hover:border-blue-500 hover:bg-blue-500 hover:text-white"
          }`}
        >
          {isInWatchlist ? <Check className="h-4 w-4" /> : <Star className="h-4 w-4" />}

          {isInWatchlist ? (
            <>
              {/* visible by default, hidden when parent (button = group class) is hovered */}
              <span className="group-hover:hidden">Watching</span> 
              {/* hidden by default, visible when parent is hovered */}
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
