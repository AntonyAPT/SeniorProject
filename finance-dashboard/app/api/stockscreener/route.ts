import { NextRequest, NextResponse } from "next/server";

// Curated universe — kept to 30 to stay within Finnhub free tier (60 req/min)
const UNIVERSE = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","JPM","V","NFLX",
  "AMD","AVGO","UNH","LLY","XOM","MA","HD","PG","COST","ORCL",
  "ABBV","MRK","CVX","BAC","KO","ADBE","CRM","CSCO","INTC","QCOM",
];

async function getQuote(symbol: string, apiKey: string) {
  const [quoteRes, profileRes] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`, { cache: "no-store" }),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`, { cache: "no-store" }),
  ]);

  const quote   = await quoteRes.json();
  const profile = profileRes.ok ? await profileRes.json() : {};

  if (!quote.c || quote.c === 0) return null;

  return {
    ticker:         symbol,
    name:           profile.name ?? symbol,
    price:          quote.c,
    change:         parseFloat((quote.c - quote.pc).toFixed(4)),
    change_percent: parseFloat((((quote.c - quote.pc) / quote.pc) * 100).toFixed(4)),
    volume:         quote.v ?? 0,
    market_cap:     profile.marketCapitalization
                      ? profile.marketCapitalization * 1_000_000
                      : undefined,
  };
}

export async function GET(req: NextRequest) {
  const type  = req.nextUrl.searchParams.get("type") ?? "gainers";
  const count = parseInt(req.nextUrl.searchParams.get("count") ?? "6", 10);

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
  }

  try {
    // Fetch all quotes in parallel
    const results = await Promise.all(
      UNIVERSE.map((sym) => getQuote(sym, apiKey).catch(() => null))
    );

    const valid = results.filter((q): q is NonNullable<typeof q> => q !== null);

    // Sort by % change
    valid.sort((a, b) =>
      type === "losers"
        ? a.change_percent - b.change_percent   // most negative first
        : b.change_percent - a.change_percent   // most positive first
    );

    return NextResponse.json(valid.slice(0, count));
  } catch (err: any) {
    console.error("[/api/stockscreener] Error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}