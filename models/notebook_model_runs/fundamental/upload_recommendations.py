"""Upload quarterly fundamental predictions to Supabase.

Run after pulling the fundamental Kaggle output:

    cd models/notebook_model_runs/fundamental
    python upload_recommendations.py

The default CSV is save_dir_fund/pred_df_test.csv. The script uploads the
latest context quarter in that file, and the dashboard API selects the top
predicted-up rows by confidence.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import numpy as np
import pandas as pd


DEFAULT_SUPABASE_URL = "https://jnjpfkbdaoxuumayxivh.supabase.co"
DEFAULT_TABLE = "fundamental_recommendations"
DEFAULT_CSV = Path(__file__).resolve().parent / "save_dir_fund" / "pred_df_test.csv"

RECOMMENDATIONS = {"down": "SELL", "flat": "HOLD", "up": "BUY"}
DATE_COLUMNS = [
    "context_start_quarter",
    "context_end_quarter",
    "decision_date",
    "forecast_end_date",
]
REQUIRED_COLUMNS = [
    *DATE_COLUMNS,
    "ticker",
    "predicted_class",
    "predicted_direction",
    "confidence",
]


def first_env(*names: str, default: str) -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload fundamental model recommendations to Supabase.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--table", default=os.getenv("SUPABASE_FUNDAMENTAL_RECOMMENDATIONS_TABLE", DEFAULT_TABLE))
    parser.add_argument(
        "--supabase-url",
        default=first_env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", default=DEFAULT_SUPABASE_URL),
    )
    parser.add_argument(
        "--supabase-key",
        default=first_env(
            "SUPABASE_RECOMMENDATIONS_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_KEY",
            default="",
        ),
    )
    parser.add_argument(
        "--latest-context-only",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Only upload rows from the latest context_end_quarter in the CSV.",
    )
    parser.add_argument("--upsert-batch-size", type=int, default=500)
    return parser.parse_args()


def finite_float(value) -> float | None:
    if pd.isna(value):
        return None
    value = float(value)
    return value if np.isfinite(value) else None


def optional_int(value) -> int | None:
    if pd.isna(value):
        return None
    return int(value)


def date_string(value) -> str:
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        raise ValueError(f"Invalid date value: {value!r}")
    return parsed.strftime("%Y-%m-%d")


def load_predictions(csv_path: Path, latest_context_only: bool) -> pd.DataFrame:
    if not csv_path.exists():
        raise SystemExit(
            f"{csv_path} not found. Run `bash pull_results.sh` from "
            "models/notebook_model_runs/fundamental first."
        )

    frame = pd.read_csv(csv_path)
    missing = sorted(set(REQUIRED_COLUMNS) - set(frame.columns))
    if missing:
        raise SystemExit(f"{csv_path} is missing required columns: {missing}")

    for column in DATE_COLUMNS:
        frame[column] = pd.to_datetime(frame[column], errors="coerce")

    if frame[DATE_COLUMNS].isna().any().any():
        bad_columns = [column for column in DATE_COLUMNS if frame[column].isna().any()]
        raise SystemExit(f"{csv_path} has invalid dates in: {bad_columns}")

    if "context_year" not in frame.columns:
        frame["context_year"] = frame["context_end_quarter"].dt.year
    if "forecast_year" not in frame.columns:
        frame["forecast_year"] = frame["context_year"] + 1

    frame["ticker"] = frame["ticker"].astype(str).str.upper().str.strip()
    frame["predicted_direction"] = frame["predicted_direction"].astype(str).str.lower().str.strip()
    frame["predicted_class"] = pd.to_numeric(frame["predicted_class"], errors="coerce")
    frame["confidence"] = pd.to_numeric(frame["confidence"], errors="coerce")
    frame = frame[np.isfinite(frame["confidence"]) & frame["predicted_class"].notna()].copy()
    frame = frame[frame["predicted_direction"].isin(RECOMMENDATIONS)].copy()

    if latest_context_only and not frame.empty:
        latest_context = frame["context_end_quarter"].max()
        frame = frame[frame["context_end_quarter"] == latest_context].copy()

    return frame.sort_values(["predicted_direction", "confidence"], ascending=[True, False])


def recommendation_records(frame: pd.DataFrame) -> list[dict]:
    run_timestamp = pd.Timestamp.now(tz="UTC").isoformat()
    records = []

    for _, row in frame.iterrows():
        direction = row["predicted_direction"]
        actual_direction = None
        if "actual_direction" in frame.columns and pd.notna(row["actual_direction"]):
            actual_direction = str(row["actual_direction"]).lower().strip()

        record = {
            "run_timestamp": run_timestamp,
            "ticker": row["ticker"],
            "context_start_quarter": date_string(row["context_start_quarter"]),
            "context_end_quarter": date_string(row["context_end_quarter"]),
            "decision_date": date_string(row["decision_date"]),
            "forecast_end_date": date_string(row["forecast_end_date"]),
            "context_year": int(row["context_year"]),
            "forecast_year": int(row["forecast_year"]),
            "predicted_class": int(row["predicted_class"]),
            "predicted_direction": direction,
            "recommendation": RECOMMENDATIONS[direction],
            "confidence": float(row["confidence"]),
            "actual_class": optional_int(row["actual_class"]) if "actual_class" in frame.columns else None,
            "actual_direction": actual_direction if actual_direction in RECOMMENDATIONS else None,
            "forward_return": finite_float(row["forward_return"]) if "forward_return" in frame.columns else None,
        }
        records.append(record)

    return records


def upsert_records(rows: list[dict], args: argparse.Namespace) -> None:
    if not args.supabase_key:
        raise SystemExit("Missing Supabase key. Set SUPABASE_RECOMMENDATIONS_KEY or SUPABASE_SERVICE_ROLE_KEY.")

    try:
        from supabase import create_client
    except ImportError as exc:
        raise SystemExit("Install supabase first: pip install supabase") from exc

    if not rows:
        print("No fundamental recommendation rows to upsert.")
        return

    client = create_client(args.supabase_url, args.supabase_key)
    print(f"Upserting {len(rows):,} fundamental recommendation row(s) to {args.table}")
    for start in range(0, len(rows), args.upsert_batch_size):
        batch = rows[start : start + args.upsert_batch_size]
        client.table(args.table).upsert(
            batch,
            on_conflict="ticker,context_end_quarter,forecast_year",
        ).execute()
        print(f"  Upserted rows {start + 1:,}-{start + len(batch):,}")


def main() -> None:
    args = parse_args()
    frame = load_predictions(args.csv, args.latest_context_only)
    rows = recommendation_records(frame)
    upsert_records(rows, args)

    up_rows = frame[frame["predicted_direction"] == "up"].nlargest(10, "confidence")
    if not up_rows.empty:
        print("\nTop quarterly BUY candidates:")
        print(up_rows[["ticker", "predicted_direction", "confidence", "forecast_year"]].to_string(index=False))


if __name__ == "__main__":
    main()
