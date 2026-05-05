#!/bin/bash
KERNEL=${1:-"antonyapt/patchtst-antonymodel"} # should match 'id' field from kernel-metadata.json

if [ -z "${KAGGLE_CONFIG_DIR:-}" ] && [ -f "$HOME/.config/kaggle/kaggle.json" ]; then
  export KAGGLE_CONFIG_DIR="$HOME/.config/kaggle"
fi

echo "Pulling training artifacts..."

# assuming you run from models/notebook
kaggle kernels output "$KERNEL" \
  -p . \
  --file-pattern "(^|/)(checkpoint|save_dir)/.*" \
  -o

echo "Done."
