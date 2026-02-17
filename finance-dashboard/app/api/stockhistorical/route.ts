import { NextRequest, NextResponse } from "next/server";

// Yahoo Finance chart API — completely free, no key required
// range + interval combos that Yahoo accepts
const RANGE_CONFIG: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d",  interval: "5m"  },
  "1W": { range: "5d",  interval: "60m" },
  "1M": { range: "1mo", interval: "1d"  },
  "1Y": { range: "1y",  interval: "1wk" },
};

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  const range  = req.nextUrl.searchParams.get("range") ?? "1D";

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const { range: yhRange, interval } = RANGE_CONFIG[range] ?? RANGE_CONFIG["1D"];
  const sym = ticker.toUpperCase();

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${sym}` +
    `?range=${yhRange}&interval=${interval}&includePrePost=false`;

  console.log("[/api/stockhistorical] Fetching:", url);

  try {
    const res = await fetch(url, {
      headers: {
        // Yahoo sometimes blocks requests without a user-agent
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("[/api/stockhistorical] Yahoo error:", res.status, text.slice(0, 300));
      return NextResponse.json(
        { error: `Yahoo Finance returned ${res.status}` },
        { status: res.status }
      );
    }

    const json = JSON.parse(text);
    const result = json?.chart?.result?.[0];

    if (!result) {
      console.warn("[/api/stockhistorical] No result in Yahoo response");
      return NextResponse.json([]);
    }

    const timestamps: number[]  = result.timestamp ?? [];
    const quotes                 = result.indicators?.quote?.[0] ?? {};
    const closes: number[]       = quotes.close  ?? [];
    const opens:  number[]       = quotes.open   ?? [];
    const highs:  number[]       = quotes.high   ?? [];
    const lows:   number[]       = quotes.low    ?? [];
    const vols:   number[]       = quotes.volume ?? [];

    // Zip into OHLCV objects — filter out any null candles Yahoo returns
    const points = timestamps
      .map((t, i) => ({
        time:   t,
        open:   opens[i],
        high:   highs[i],
        low:    lows[i],
        close:  closes[i],
        volume: vols[i],
      }))
      .filter((p) => p.close != null);

    return NextResponse.json(points);
  } catch (err: any) {
    console.error("[/api/stockhistorical] Error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}