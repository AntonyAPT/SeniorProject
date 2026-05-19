"""Run quarterly weighting-strategy comparisons locally using a saved pred_df CSV.

No model, no GPU, no Kaggle needed.  Pull pred_df_test.csv first:
    bash pull_results.sh

Then run:
    python backtest_local.py
    python backtest_local.py --top_n 5
    python backtest_local.py --weighting confidence rank equal
"""

import argparse
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

# Add models/ to sys.path so patchtst_lib is importable when running this
# script directly from the models/notebooks/fundamental/ directory.
sys.path.insert(0, str(Path(__file__).parents[2]))

import patchtst_lib.fundamental.backtest as fbt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv",
        default=str(Path(__file__).parent / "save_dir_fund" / "pred_df_test.csv"),
        help="Path to pred_df_test.csv downloaded from Kaggle.",
    )
    parser.add_argument("--capital", type=float, default=1000.0)
    parser.add_argument("--top_n", type=int, default=10)
    parser.add_argument(
        "--weighting",
        nargs="+",
        default=["equal", "confidence", "rank"],
        choices=["equal", "confidence", "rank"],
    )
    parser.add_argument(
        "--forecast-year",
        type=int,
        default=None,
        help=(
            "Calendar year of Q1 to evaluate (e.g. 2025 = Q4-2024 fundamentals "
            "predicting Q1-2025). Default: latest year in the CSV."
        ),
    )
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"ERROR: {csv_path} not found.")
        print("Run `bash pull_results.sh` from models/notebooks/fundamental first.")
        raise SystemExit(1)

    pred_df = pd.read_csv(
        csv_path,
        parse_dates=["decision_date", "forecast_end_date"],
    )
    print(f"Loaded {len(pred_df):,} prediction rows from {csv_path.name}")
    print(
        f"Decision-date range: {pred_df['decision_date'].min().date()} "
        f"-> {pred_df['decision_date'].max().date()}"
    )

    pred_df_bt = fbt.filter_prior_year_to_following_q1(
        pred_df, forecast_year=args.forecast_year
    )
    if pred_df_bt.empty:
        print("ERROR: No Q4→following-Q1 rows after filtering.")
        raise SystemExit(1)

    fy = int(pred_df_bt["forecast_year"].iloc[0])
    cy = int(pred_df_bt["context_year"].iloc[0])
    print(
        f"Backtest scope: Q4-{cy} fundamentals → Q1-{fy} "
        f"({len(pred_df_bt):,} rows, 1 rebalance)\n"
    )

    colors = {"equal": "tab:blue", "confidence": "tab:orange", "rank": "tab:green"}
    fig, ax = plt.subplots(figsize=(13, 5))
    summaries = {}

    for w in args.weighting:
        res = fbt.run_backtest(
            pred_df_bt,
            starting_capital=args.capital,
            top_n=args.top_n,
            weighting=w,
        )
        summaries[w] = fbt.summarize_results(res)
        eq = res["quarterly_equity"]
        ret = res["total_return_pct"]
        eq.plot(
            ax=ax,
            color=colors.get(w, None),
            linewidth=1.5,
            marker="o",
            markersize=4,
            label=f"{w}  ({ret:+.1f}%)",
        )

    ax.axhline(
        args.capital,
        color="gray",
        linestyle="--",
        linewidth=0.8,
        label=f"${args.capital:,.0f} baseline",
    )
    ax.set_title(
        f"Q1-{fy} Backtest (Q4-{cy} Fundamentals) — Top-{args.top_n} Up Picks"
    )
    ax.set_xlabel("Decision Date")
    ax.set_ylabel("Portfolio Value ($)")
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()

    print("\nReturn summary:")
    for w, s in summaries.items():
        sharpe = s["annualized_sharpe"]
        sharpe_str = f"{sharpe:>+7.3f}" if sharpe is not None and pd.notna(sharpe) else "    N/A"
        print(
            f"  {w:<12} {s['total_return_pct']:>+7.2f}%   "
            f"max_dd {s['max_drawdown_pct']:>+6.2f}%   "
            f"avg_q_ret {s['avg_quarterly_return_selected']:>+.4%}   "
            f"sharpe {sharpe_str}"
        )


if __name__ == "__main__":
    main()
