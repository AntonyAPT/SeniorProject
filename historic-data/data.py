import pandas as pd
import yfinance as yf
import requests

# Step 1: Get S&P 500 tickers and sectors from Wikipedia
print("Fetching S&P 500 tickers and sectors...")
url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
response = requests.get(url, headers=headers)
table = pd.read_html(response.text)[0]

# Build ticker -> sector mapping
table["Symbol"] = table["Symbol"].str.replace(".", "-")
sector_map = dict(zip(table["Symbol"], table["GICS Sector"]))
tickers = list(sector_map.keys())
print(f"Found {len(tickers)} tickers across {table['GICS Sector'].nunique()} sectors")

# Step 2: Download all historical daily data from 2000
print("Downloading historical data from 2000 (this may take a few minutes)...")
df = yf.download(
    tickers,
    start="2000-01-01",
    interval="1d",
    group_by="ticker",
    auto_adjust=True,
    threads=True
)

# Step 3: Reshape from wide MultiIndex format to long format
print("Reshaping data...")
df = df.stack(level=0, future_stack=True).reset_index()
df.columns.name = None
df.rename(columns={"level_1": "Ticker"}, inplace=True)

# Step 4: Add sector column
df["Sector"] = df["Ticker"].map(sector_map)

# Step 5: Lowercase all columns for Supabase compatibility
df.columns = [c.lower() for c in df.columns]
df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")

# Step 6: Save to CSV
output_path = "sp500_daily_max.csv"
print(f"Saving to {output_path}...")
df.to_csv(output_path, index=False)
print(f"Done! {len(df):,} rows saved to {output_path}")
print(df.head())
print(f"\nSectors included: {df['sector'].unique()}")