import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  DbFundamentalRecommendationRow,
  FundamentalRecommendation,
} from "@/types/model-recommendations";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "10"), 50);
  const direction = req.nextUrl.searchParams.get("direction");
  const sortBy = req.nextUrl.searchParams.get("sort_by") ?? "confidence";
  const allowedDirections = new Set(["down", "flat", "up"]);
  const allowedSortColumns = new Set(["confidence"]);

  if (!Number.isInteger(limit) || limit < 1) {
    return NextResponse.json({ error: "limit must be a positive integer" }, { status: 400 });
  }

  if (direction && !allowedDirections.has(direction)) {
    return NextResponse.json({ error: "direction must be down, flat, or up" }, { status: 400 });
  }

  if (!allowedSortColumns.has(sortBy)) {
    return NextResponse.json({ error: "sort_by must be confidence" }, { status: 400 });
  }

  const { data: latest, error: latestError } = await supabase
    .from("fundamental_recommendations")
    .select("context_end_quarter")
    .order("context_end_quarter", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error("[/api/fundamental-recommendations] latest context error:", latestError.message);
    return NextResponse.json({ error: latestError.message }, { status: 500 });
  }

  if (!latest?.context_end_quarter) {
    return NextResponse.json([]);
  }

  let query = supabase
    .from("fundamental_recommendations")
    .select(
      "ticker, context_start_quarter, context_end_quarter, decision_date, forecast_end_date, context_year, forecast_year, predicted_class, predicted_direction, recommendation, confidence, actual_class, actual_direction, forward_return, run_timestamp"
    )
    .eq("context_end_quarter", latest.context_end_quarter);

  if (direction) {
    query = query.eq("predicted_direction", direction);
  }

  const { data, error } = await query
    .order(sortBy, { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[/api/fundamental-recommendations] query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: FundamentalRecommendation[] = ((data ?? []) as DbFundamentalRecommendationRow[]).map((row) => ({
    ticker: row.ticker,
    contextStartQuarter: row.context_start_quarter,
    contextEndQuarter: row.context_end_quarter,
    decisionDate: row.decision_date,
    forecastEndDate: row.forecast_end_date,
    contextYear: row.context_year,
    forecastYear: row.forecast_year,
    predictedClass: row.predicted_class,
    predictedDirection: row.predicted_direction,
    recommendation: row.recommendation,
    confidence: row.confidence,
    actualClass: row.actual_class,
    actualDirection: row.actual_direction,
    forwardReturn: row.forward_return,
    runTimestamp: row.run_timestamp,
  }));

  return NextResponse.json(rows);
}
