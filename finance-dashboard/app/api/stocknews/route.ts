import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error("[/api/stocknews] Missing FINNHUB_API_KEY in .env.local");
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
  }

  // Finnhub requires a date range — last 7 days
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);

  const fmt = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD

  const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker.toUpperCase()}&from=${fmt(from)}&to=${fmt(to)}&token=${apiKey}`;

  console.log("[/api/stocknews] Fetching:", url.replace(apiKey, "***"));

  try {
    const res  = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    console.log("[/api/stocknews] Status:", res.status, "Preview:", text.slice(0, 200));

    if (!res.ok) {
      return NextResponse.json(
        { error: `Finnhub returned ${res.status}: ${text}` },
        { status: res.status }
      );
    }

    const raw: {
      headline: string;
      datetime: number; // unix seconds
      url: string;
      source: string;
      summary: string;
      image: string;
    }[] = JSON.parse(text);

    // Normalise to the shape the frontend expects, limit to 5
    const news = raw.slice(0, 5).map((item) => ({
      title:        item.headline,
      published_at: new Date(item.datetime * 1000).toISOString(),
      url:          item.url,
      source:       item.source,
      summary:      item.summary,
      image:        item.image,
    }));

    return NextResponse.json(news);
  } catch (err: any) {
    console.error("[/api/stocknews] Error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}