export type PredictionDirection = "down" | "flat" | "up";
export type RecommendationAction = "SELL" | "HOLD" | "BUY";

export interface ModelRecommendation {
  ticker: string;
  sector: string | null;
  industry: string | null;
  contextEnd: string;
  forecastDay: number;
  forecastDate: string;
  predictedClass: number;
  predictedDirection: PredictionDirection;
  recommendation: RecommendationAction;
  confidence: number;
  probDown: number;
  probFlat: number;
  probUp: number;
  lastClose: number | null;
  runTimestamp: string;
}

export interface DbRecommendationRow {
  ticker: string;
  sector: string | null;
  industry: string | null;
  context_end: string;
  forecast_day: number;
  forecast_date: string;
  predicted_class: number;
  predicted_direction: PredictionDirection;
  recommendation: RecommendationAction;
  confidence: number;
  prob_down: number;
  prob_flat: number;
  prob_up: number;
  last_close: number | null;
  run_timestamp: string;
}

export interface FundamentalRecommendation {
  ticker: string;
  contextStartQuarter: string;
  contextEndQuarter: string;
  decisionDate: string;
  forecastEndDate: string;
  contextYear: number;
  forecastYear: number;
  predictedClass: number;
  predictedDirection: PredictionDirection;
  recommendation: RecommendationAction;
  confidence: number;
  actualClass: number | null;
  actualDirection: PredictionDirection | null;
  forwardReturn: number | null;
  runTimestamp: string;
}

export interface DbFundamentalRecommendationRow {
  ticker: string;
  context_start_quarter: string;
  context_end_quarter: string;
  decision_date: string;
  forecast_end_date: string;
  context_year: number;
  forecast_year: number;
  predicted_class: number;
  predicted_direction: PredictionDirection;
  recommendation: RecommendationAction;
  confidence: number;
  actual_class: number | null;
  actual_direction: PredictionDirection | null;
  forward_return: number | null;
  run_timestamp: string;
}
