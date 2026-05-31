#!/bin/bash
set -euo pipefail

KERNEL=${1:-"kingz101/patchtst-technical-classifier"} # matches 'id' in kernel-metadata.json

echo "Pulling training artifacts and predictions..."

# assuming you run from models/notebook_model_runs
kaggle kernels output $KERNEL \
  -p . \
  --file-pattern "(^|/)(checkpoint|save_dir)/.*" \
  -o

echo "Pulling pred_df_test.csv for local backtest experiments..."
kaggle kernels output $KERNEL \
  -p . \
  --file-pattern "pred_df_test.csv" \
  -o

echo "Pulling ticker_industry.json for local inference..."
kaggle kernels output $KERNEL \
  -p . \
  --file-pattern "ticker_industry.json" \
  -o

echo "Done. Run backtest_local.py to compare weighting strategies without the model."
