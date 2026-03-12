import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

export async function GET(req: NextRequest) {
  const tickerRaw = req.nextUrl.searchParams.get("ticker");
  const tic = tickerRaw?.trim().toUpperCase();

  if (!tic) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const { data: rows, error } = await supabase
    .from("quarterly_fundamentals")
    .select("tic,datadate,fyearq,fqtr,revtq,niq,epspxq,atq,ltq,dlttq,dlcq")
    .eq("tic", tic)
    .order("datadate", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticker: tic, rows: rows ?? [] });
}