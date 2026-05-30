#!/bin/bash
KERNEL=${1:-"kingz101/patchtst-fundamental-classifier"}

echo "Pulling fundamental training artifacts..."

# Run from models/notebook_model_runs/fundamental/
kaggle kernels output $KERNEL \
  -p . \
  --file-pattern "(^|/)(checkpoint|save_dir_fund)/.*" \
  -o

echo "Pulling pred_df_test.csv for local backtest experiments..."
kaggle kernels output $KERNEL \
  -p . \
  --file-pattern "pred_df_test.csv" \
  -o

echo "Done. Run backtest_local.py to compare weighting strategies without the model."
