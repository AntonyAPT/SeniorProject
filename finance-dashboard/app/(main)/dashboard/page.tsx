import DashboardPage from "./DashboardPage";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioItem } from "./PortfolioPanel";

export type DashboardWatchlistItem = {
  ticker: string;
  companyName: string;
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's default watchlist items
  let watchlistItems: DashboardWatchlistItem[] = [];

  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("id")
    .eq("user_id", user!.id)
    .eq("is_default", true)
    .maybeSingle();

  if (watchlist) {
    const { data: items } = await supabase
      .from("watchlist_items")
      .select("stock_ticker, stocks(company_name)")
      .eq("watchlist_id", watchlist.id)
      .order("added_at", { ascending: false })
      .limit(6);

    watchlistItems = (items ?? []).map((item) => ({
      ticker: item.stock_ticker ?? "",
      companyName: (item.stocks as any)?.company_name ?? "",
    })).filter((i) => i.ticker);
  }

  // Fetch default portfolio items for the portfolio panel
  let portfolioItems: PortfolioItem[] = [];

  const { data: defaultPortfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user!.id)
    .eq("is_default", true)
    .maybeSingle();

  if (defaultPortfolio) {
    const { data: items } = await supabase
      .from("portfolio_items")
      .select("stock_ticker, quantity, buy_price, buy_date, transaction_type")
      .eq("portfolio_id", defaultPortfolio.id)
      .order("buy_date", { ascending: true });

    portfolioItems = (items ?? []).map((item) => ({
      ticker: item.stock_ticker,
      quantity: item.quantity,
      buy_price: item.buy_price,
      buy_date: item.buy_date,
      transaction_type: item.transaction_type,
    }));
  }

  return <DashboardPage watchlistItems={watchlistItems} portfolioItems={portfolioItems} />;
}
