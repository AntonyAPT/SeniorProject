import { NextRequest, NextResponse } from "next/server";

export interface StockSearchResult {
  symbol: string;
  displaySymbol: string;
  description: string;
  type: string;
  exchange: string;
  sector: string;
}

/**
 * Searches for stocks by ticker or company name using Finnhub's symbol search
 * endpoint, then enriches the top 5 results with exchange and sector data via
 * the profile2 endpoint.
 *
 * @param req - Requires `q` query param (the search term).
 * @returns Array of up to 5 enriched StockSearchResult objects.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json([], { status: 200 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error("[/api/stocksearch] Missing FINNHUB_API_KEY in .env.local");
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
  }

  try {
    const searchRes = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${apiKey}`,
      { cache: "no-store" }
    );

    if (!searchRes.ok) {
      return NextResponse.json({ error: "Finnhub search failed" }, { status: 502 });
    }

    const searchData = await searchRes.json();
    const rawResults: { symbol: string; displaySymbol: string; description: string; type: string }[] =
      searchData.result ?? [];

    // Only process the top 5 to stay within free-tier rate limits (1 search + up to 5 profile calls)
    const top5 = rawResults.slice(0, 5);

    const enriched = await Promise.all(
      top5.map(async (item) => {
        try {
          const profileRes = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${item.symbol}&token=${apiKey}`,
            { cache: "no-store" }
          );
          const profile = profileRes.ok ? await profileRes.json() : {};
          return {
            symbol:        item.symbol,
            displaySymbol: item.displaySymbol,
            description:   item.description,
            type:          item.type,
            exchange:      profile.exchange ?? "",
            sector:        profile.finnhubIndustry ?? "",
          } satisfies StockSearchResult;
        } catch {
          return {
            symbol:        item.symbol,
            displaySymbol: item.displaySymbol,
            description:   item.description,
            type:          item.type,
            exchange:      "",
            sector:        "",
          } satisfies StockSearchResult;
        }
      })
    );

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("[/api/stocksearch] Error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
