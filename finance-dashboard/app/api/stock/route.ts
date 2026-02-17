import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const apiKey = process.env.API_NINJA_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.api-ninjas.com/v1/stockprice?ticker=${ticker.toUpperCase()}`,
      {
        headers: { "X-Api-Key": apiKey },
        // Revalidate every 60 seconds
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `API-Ninjas error: ${res.status} ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}