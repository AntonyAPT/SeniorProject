import { NextRequest, NextResponse } from "next/server";

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

/**
 * Fetches real-time Finnhub quotes for one or more symbols.
 * Accepts a comma-separated `symbols` query param (e.g. ?symbols=AAPL,MSFT).
 * Fires all requests in parallel and returns an array of StockQuote objects.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols")?.trim();
  if (!raw) {
    return NextResponse.json([], { status: 200 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error("[/api/stockquote] Missing FINNHUB_API_KEY in .env.local");
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
  }

  const symbols = raw.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
            { cache: "no-store" }
          );
          if (!res.ok) throw new Error(`Finnhub returned ${res.status}`);
          const data = await res.json();
          return {
            symbol,
            currentPrice: data.c ?? 0,
            change: data.d ?? 0,
            changePercent: data.dp ?? 0,
            high: data.h ?? 0,
            low: data.l ?? 0,
            open: data.o ?? 0,
            prevClose: data.pc ?? 0,
          } satisfies StockQuote;
        } catch {
          return {
            symbol,
            currentPrice: 0,
            change: 0,
            changePercent: 0,
            high: 0,
            low: 0,
            open: 0,
            prevClose: 0,
          } satisfies StockQuote;
        }
      })
    );

    return NextResponse.json(quotes);
  } catch (err: any) {
    console.error("[/api/stockquote] Error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
