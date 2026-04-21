import pandas as pd
import yfinance as yf
import requests
from datetime import datetime, timedelta
from supabase import create_client

# ── Supabase credentials ────────────────────────────────────────────────────
SUPABASE_URL = "https://jnjpfkbdaoxuumayxivh.supabase.co"       # e.g. https://xxxx.supabase.co
SUPABASE_KEY = "sb_publishable_-JvliZ3nQWSWVD9UTmP6xw_j9BDFaFd"  # found in Supabase project settings
TABLE_NAME   = "historic_data"
# ────────────────────────────────────────────────────────────────────────────

CSV_PATH = "sp500_daily_max.csv"
BATCH_SIZE = 500  # Supabase upsert limit per request

# Step 1: Load existing CSV and find last date
print("Loading existing data...")
existing = pd.read_csv(CSV_PATH, parse_dates=["Date"])
last_date = existing["Date"].max()
start_date = (last_date + timedelta(days=1)).strftime("%Y-%m-%d")
today = datetime.today().strftime("%Y-%m-%d")

print(f"Last date in CSV: {last_date.date()}")
print(f"Fetching new data from {start_date} to {today}...")

if start_date >= today:
    print("Already up to date — nothing to fetch.")
    exit()

# Step 2: Get current S&P 500 tickers
url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
response = requests.get(url, headers=headers)
table = pd.read_html(response.text)[0]
tickers = [t.replace(".", "-") for t in table["Symbol"].tolist()]

# Step 3: Download only new data
new_data = yf.download(
    tickers,
    start=start_date,
    end=today,
    interval="1d",
    group_by="ticker",
    auto_adjust=True,
    threads=True
)

if new_data.empty:
    print("No new data returned — market may have been closed since last update.")
    exit()

# Step 4: Reshape to long format
new_data = new_data.stack(level=0).reset_index()
new_data.columns.name = None
new_data.rename(columns={"level_1": "Ticker"}, inplace=True)

# Lowercase columns to match Supabase table schema
new_data.columns = [c.lower() for c in new_data.columns]
new_data["date"] = new_data["date"].dt.strftime("%Y-%m-%d")

# Step 5: Update local CSV
print(f"Appending {len(new_data):,} new rows to CSV...")
existing.columns = [c.lower() for c in existing.columns]
combined = pd.concat([existing, new_data], ignore_index=True)
combined.drop_duplicates(subset=["date", "ticker"], keep="last", inplace=True)
combined.sort_values(["ticker", "date"], inplace=True)
combined.to_csv(CSV_PATH, index=False)
print(f"CSV updated to {combined['date'].max()}")

# Step 6: Push new rows to Supabase
print("Pushing new data to Supabase...")
client = create_client(SUPABASE_URL, SUPABASE_KEY)
rows = new_data.to_dict(orient="records")

# Upsert in batches to stay within Supabase limits
for i in range(0, len(rows), BATCH_SIZE):
    batch = rows[i:i+BATCH_SIZE]
    client.table(TABLE_NAME).upsert(batch).execute()
    print(f"  Upserted rows {i+1}–{min(i+BATCH_SIZE, len(rows))} of {len(rows)}")

print(f"Done! Supabase table '{TABLE_NAME}' is up to date.")