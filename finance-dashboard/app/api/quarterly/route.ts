import { NextRequest, NextResponse } from "next/server";
import { getQuarterlyFundamentals } from "@/lib/quarterly";

export async function GET(req: NextRequest) {
  const tickerRaw = req.nextUrl.searchParams.get("ticker");
  const tic = tickerRaw?.trim().toUpperCase();

  if (!tic) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  try {
    const rows = await getQuarterlyFundamentals(tic);
    return NextResponse.json({ ticker: tic, rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
