import pandas as pd
import time
from supabase import create_client

# ── Supabase credentials ────────────────────────────────────────────────────
SUPABASE_URL = "https://jnjpfkbdaoxuumayxivh.supabase.co"       # e.g. https://xxxx.supabase.co
SUPABASE_KEY = "sb_publishable_-JvliZ3nQWSWVD9UTmP6xw_j9BDFaFd"  # found in Supabase project settings
TABLE_NAME   = "historic_data"
# ────────────────────────────────────────────────────────────────────────────

CSV_PATH = "sp500_daily_max.csv"
BATCH_SIZE = 250       # smaller batch = less likely to disconnect
MAX_RETRIES = 5        # retry each batch this many times before giving up
PROGRESS_FILE = "upload_progress.txt"  # tracks last successful batch

# Load full CSV
print("Loading CSV...")
df = pd.read_csv(CSV_PATH)
df.columns = [c.lower() for c in df.columns]
df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
df.dropna(subset=["open", "high", "low", "close", "volume"], how="all", inplace=True)
df = df.where(pd.notnull(df), None)
print(f"Loaded {len(df):,} rows | {df['date'].min()} to {df['date'].max()}")

# Check for existing progress
start_batch = 0
try:
    with open(PROGRESS_FILE, "r") as f:
        start_batch = int(f.read().strip())
    print(f"Resuming from batch {start_batch} ({start_batch * BATCH_SIZE:,} rows already uploaded)")
except FileNotFoundError:
    print("Note: Make sure you have run TRUNCATE TABLE historic_data in Supabase SQL editor first.")
    input("Press Enter to start upload, or Ctrl+C to cancel...")

# Upsert in batches with retry
client = create_client(SUPABASE_URL, SUPABASE_KEY)
rows = df.to_dict(orient="records")
total = len(rows)
total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
print(f"Uploading {total:,} rows in batches of {BATCH_SIZE} ({total_batches} batches total)...")

for batch_num in range(start_batch, total_batches):
    i = batch_num * BATCH_SIZE
    batch = rows[i:i+BATCH_SIZE]

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            client.table(TABLE_NAME).upsert(batch).execute()
            break  # success, move to next batch
        except Exception as e:
            if attempt == MAX_RETRIES:
                print(f"\nFailed batch {batch_num} after {MAX_RETRIES} attempts. Saving progress and exiting.")
                with open(PROGRESS_FILE, "w") as f:
                    f.write(str(batch_num))
                raise
            wait = 2 ** attempt  # exponential backoff: 2s, 4s, 8s...
            print(f"  Batch {batch_num} attempt {attempt} failed ({e}). Retrying in {wait}s...")
            time.sleep(wait)

    # Save progress after every successful batch
    with open(PROGRESS_FILE, "w") as f:
        f.write(str(batch_num + 1))

    if batch_num % 50 == 0:
        print(f"  {min(i+BATCH_SIZE, total):,} / {total:,} rows uploaded (batch {batch_num+1}/{total_batches})")

# Clean up progress file on success
import os
if os.path.exists(PROGRESS_FILE):
    os.remove(PROGRESS_FILE)

print("Done! All rows uploaded successfully.")