# PatchTST Stock Classifier Notebook

This folder contains the Phase 2 modeling notebook for training a PatchTST-based
classifier on stock OHLCV data.

The notebook predicts one class for each of the next five trading days:

- `0`: significantly lower close
- `1`: roughly flat close
- `2`: significantly higher close

The first working label rule is a fixed percentage threshold. You can later swap
it for rolling-volatility or ATR thresholds by changing `LABEL_RULE` and related
hyperparameters in the notebook config cell.

---

## Environment

These instructions target a **Linux environment**. The two supported setups are:

| System | Recommended environment |
|---|---|
| Windows laptop | WSL2 (Ubuntu 22.04 or 24.04) |
| macOS (Intel or Apple Silicon) | macOS terminal directly |

Native Windows is **not recommended** — pip fails on several packages because
Windows enforces a 260-character path limit that many deep package trees exceed
(`jupyterlab` static assets, `granite-tsfm` git checkout, etc.).

---

## Setup: WSL2 (Windows)

### 1. Install WSL2 and Ubuntu

From PowerShell (as Administrator):

```powershell
wsl --install -d Ubuntu-22.04
```

Restart when prompted, then open the Ubuntu app to finish the Ubuntu setup.

### 2. Install Python and create a virtual environment

Inside the WSL2 Ubuntu terminal:

```bash
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git
cd ../SeniorProject/models/notebook
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
```

> Tip: if file I/O feels slow, copy the project into the WSL home directory
> (`~/SeniorProject`) and work from there instead of `/mnt/c/...`.

### 3. Install PyTorch with CUDA (RTX 3050 Ti)

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
```

NVIDIA's Windows GPU driver is automatically shared with WSL2 — no separate
Linux driver install is needed.

Note: torch install will take several minutes to download (~2-3 GB) over any connection. That's normal too — don't assume it's frozen unless it's been sitting with zero progress for 10+ minutes.

### 4. Install the rest of the dependencies

```bash
pip install -r requirements.txt
python -m ipykernel install --user --name patchtst-stock --display-name "patchtst-stock (WSL)"
```

### 5. Select the kernel in Cursor

Open the notebook in Cursor and choose **"patchtst-stock (WSL)"** from the kernel
picker in the top-right corner.

---

## Setup: macOS

```bash
cd models/notebook
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install torch torchvision torchaudio   # uses MPS on Apple Silicon automatically
pip install -r requirements.txt
python -m ipykernel install --user --name patchtst-stock --display-name "patchtst-stock"
```

---

## Device Notes

The notebook selects the best available backend automatically:

```python
DEVICE_OVERRIDE = None   # None | 'cuda' | 'mps' | 'cpu'
DTYPE_OVERRIDE = None    # None | 'bfloat16' | 'float16' | 'float32'
```

| Setup | Auto-selected device | Auto-selected dtype |
|---|---|---|
| WSL2 + NVIDIA GPU | `cuda` | `bfloat16` (Ampere+) or `float16` |
| Apple Silicon Mac | `mps` | `float32` |
| CPU only | `cpu` | `float32` |

If you hit GPU out-of-memory errors, reduce `BATCH_SIZE` from `64` to `32` or
`16` in the config cell.

---

## TensorBoard

Training logs are written under:

```
./checkpoint/patchtst_cls/
```

Launch TensorBoard from the `models/notebook` directory:

```bash
tensorboard --logdir ./checkpoint/patchtst_cls/
```

Then open the printed local URL in your browser.

---

## IBM Granite Baseline

The IBM Granite cells load `ibm-granite/granite-timeseries-patchtst` as a
zero-shot forecaster, convert the first five forecasted closes into up/flat/down
classes, and compare those to the trained classifiers.

To enable this section:

1. Uncomment the `granite-tsfm` line in `requirements.txt`.
2. Reinstall: `pip install -r requirements.txt`
3. Set `RUN_GRANITE_BASELINE = True` in the notebook config cell.

This works cleanly in WSL2 and macOS. It is disabled by default because the
`granite-tsfm` repository contains filenames that are too long for native
Windows to check out.

LoRA / `peft` are included for parity with the reference notebook but are not
used by the from-scratch classifier.

---

## Known Issues / Gotchas

### `LazyLinear` + HuggingFace Trainer ≥ 4.56

`MultiDayClassificationHead` in `classification_head.py` uses `nn.LazyLinear`
so the wrapper stays robust to PatchTST output-shape variations across
`transformers` versions. Starting in `transformers` 4.56, `Trainer.train()`
calls `get_model_param_count(...)` (which invokes `.numel()` on every
parameter) **before** running the first forward pass, which raises:

```
ValueError: Attempted to use an uninitialized parameter in <method 'numel' ...>.
This error happens when you are using a `LazyModule` ...
```

**Fix already applied:** `PatchTSTClassifier.__init__` runs a single dummy
`forward()` at the end of construction (see `_materialize_lazy_params`) so the
lazy weights are concrete by the time any caller (Trainer, manual loops,
`save_pretrained`, etc.) touches them. No action needed at the notebook level.

If you replace the head with a fresh `nn.LazyLinear` somewhere else, remember
to call the same warm-up trick or you'll see the same crash.

### torch / torchvision / torchaudio version pinning

`granite-tsfm` ≤ 0.3.3 caps `torch < 2.11`, but pip's resolver only downgrades
`torch` when it sees that constraint — it leaves `torchvision` / `torchaudio`
at whatever was previously installed. The mismatched ABI then crashes any
`import transformers` chain that touches torchvision (image transforms in the
loss module) with:

```
RuntimeError: operator torchvision::nms does not exist
```

**Fix already applied:** `requirements.txt` pins the trio together
(`torch==2.8.0` / `torchvision==0.23.0` / `torchaudio==2.8.0`) and uses
`--extra-index-url https://download.pytorch.org/whl/cu128` so a fresh
`pip install -r requirements.txt` lands on a consistent CUDA build.

If you ever bump one of those three, bump all three to the matching release
listed at <https://pytorch.org/get-started/previous-versions/>.
