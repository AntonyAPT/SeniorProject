import pandas as pd
import yfinance as yf
import requests

# Step 1: Get S&P 500 tickers from Wikipedia (with browser headers to avoid 403)
print("Fetching S&P 500 tickers...")
url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
response = requests.get(url, headers=headers)
table = pd.read_html(response.text)[0]
tickers = table["Symbol"].tolist()

# Some tickers use dots on Wikipedia but yfinance needs dashes (e.g. BRK.B -> BRK-B)
tickers = [t.replace(".", "-") for t in tickers]
print(f"Found {len(tickers)} tickers")

# Step 2: Download all historical daily data
print("Downloading historical data (this may take a few minutes)...")
df = yf.download(
    tickers,
    start="2000-01-01",
    interval="1d",
    group_by="ticker",
    auto_adjust=True,
    threads=True
)

# Step 3: Reshape from wide MultiIndex format to long format (easier to work with)
print("Reshaping data...")
df = df.stack(level=0).reset_index()
df.columns.name = None
df.rename(columns={"level_1": "Ticker"}, inplace=True)

# Step 4: Save to CSV
output_path = "sp500_daily_max.csv"
print(f"Saving to {output_path}...")
df.to_csv(output_path, index=False)
print(f"Done! {len(df):,} rows saved to {output_path}")
print(df.head())