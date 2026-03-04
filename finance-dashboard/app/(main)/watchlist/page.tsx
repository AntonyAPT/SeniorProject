import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WatchlistPage } from "./WatchlistPage";

export type WatchlistItem = {
  id: string;
  ticker: string;
  companyName: string;
  addedAt: string;
};

export default async function WatchlistPageWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Get user's default watchlist
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!watchlist) {
    return <WatchlistPage items={[]} />;
  }

  // Get watchlist items ordered newest first
  const { data: items, error } = await supabase
    .from("watchlist_items")
    .select("id, stock_ticker, added_at")
    .eq("watchlist_id", watchlist.id)
    .order("added_at", { ascending: false });

  if (error) {
    console.error("[/watchlist] Error fetching items:", error);
    return <WatchlistPage items={[]} />;
  }

  const tickers = (items ?? [])
    .map((i) => i.stock_ticker)
    .filter(Boolean) as string[];

  // Batch-fetch company names from stocks reference table
  let companyNames: Record<string, string> = {};
  if (tickers.length > 0) {
    const { data: stocks } = await supabase
      .from("stocks")
      .select("ticker, company_name")
      .in("ticker", tickers);

    companyNames = Object.fromEntries(
      (stocks ?? []).map((s) => [s.ticker, s.company_name ?? ""])
    );
  }

  const enrichedItems: WatchlistItem[] = (items ?? []).map((item) => ({
    id: item.id,
    ticker: item.stock_ticker ?? "",
    companyName: item.stock_ticker ? (companyNames[item.stock_ticker] ?? "") : "",
    addedAt: item.added_at ?? "",
  }));

  return <WatchlistPage items={enrichedItems} />;
}
