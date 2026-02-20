import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error("[/api/stock] Missing FINNHUB_API_KEY in .env.local");
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
  }

  const sym = ticker.toUpperCase();

  try {
    // Fetch quote + profile in parallel
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`, { cache: "no-store" }),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${sym}&token=${apiKey}`, { cache: "no-store" }),
    ]);

    const quote   = await quoteRes.json();
    const profile = profileRes.ok ? await profileRes.json() : {};

    // Finnhub quote fields: c=current, o=open, h=high, l=low, pc=prev close, v=volume, t=timestamp
    if (!quote.c || quote.c === 0) {
      return NextResponse.json(
        { error: `No data found for "${sym}". Check the ticker symbol.` },
        { status: 404 }
      );
    }

    // Normalise to the shape page.tsx already expects
    const data = {
      ticker:         sym,
      name:           profile.name        ?? sym,
      exchange:       profile.exchange     ?? "",
      currency:       profile.currency     ?? "USD",
      price:          quote.c,
      open:           quote.o,
      high:           quote.h,
      low:            quote.l,
      volume:         quote.v             ?? 0,
      market_cap:     profile.marketCapitalization
                        ? profile.marketCapitalization * 1_000_000
                        : undefined,
      change:         parseFloat((quote.c - quote.pc).toFixed(4)),
      change_percent: parseFloat((((quote.c - quote.pc) / quote.pc) * 100).toFixed(4)),
      pe_ratio:       profile.pe          ?? undefined,
      dividend_yield: undefined,           // not in free Finnhub quote
    };

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[/api/stock] Error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}