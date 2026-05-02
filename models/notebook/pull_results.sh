#!/bin/bash
KERNEL=${1:-"kingz101/patchtst-new-branch-test"} # should match 'id' field from kernel-metadata.json

echo "Pulling training artifacts..."

# assuming you run from models/notebook
kaggle kernels output $KERNEL \
  -p . \
  --file-pattern "(^|/)(checkpoint|save_dir)/.*" \
  -o

echo "Done."