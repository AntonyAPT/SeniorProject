import { createClient } from "@/lib/supabase/server";
import { StockDetailWidgets } from "@/components/tradingview";
import { AddToWatchlistButton } from "./AddToWatchlistButton";

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch company name and user's default watchlist in parallel
  const [stockResult, watchlistResult] = await Promise.all([
    supabase.from("stocks").select("company_name").eq("ticker", symbol).maybeSingle(),
    user
      ? supabase.from("watchlists").select("id").eq("user_id", user.id).eq("is_default", true).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const companyName = stockResult.data?.company_name ?? "";

  // Check if this ticker is already in the watchlist
  let watchlistItemId: string | null = null;
  if (user && watchlistResult.data) {
    const { data: item } = await supabase
      .from("watchlist_items")
      .select("id")
      .eq("watchlist_id", watchlistResult.data.id)
      .eq("stock_ticker", symbol)
      .maybeSingle();
    watchlistItemId = item?.id ?? null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{symbol}</h1>
            {companyName && <p className="text-slate-400 mt-1">{companyName}</p>}
          </div>
          {user && (
            <AddToWatchlistButton
              ticker={symbol}
              companyName={companyName}
              initialItemId={watchlistItemId}
            />
          )}
        </div>

        <StockDetailWidgets symbol={symbol} />
      </div>
    </div>
  );
}
