import type {
  MarketOverviewProps,
  StockHeatmapProps,
  StockMarketProps,
  TimelineProps,
} from "react-ts-tradingview-widgets";

/**
 * Shared defaults for TradingView widgets that use `autosize`.
 */
export const tradingViewBaseConfig = {
  colorTheme: "dark" as const,
  autosize: true,
  isTransparent: true,
  locale: "en" as const,
};

/**
 * Shared defaults for StockHeatmap, which uses `autoSize` (capital S).
 */
export const stockHeatmapBaseConfig = {
  colorTheme: "dark" as const,
  autoSize: true,
  isTransparent: true,
  locale: "en" as const,
};

/**
 * Stock Heatmap configuration for full-market visual coverage.
 */
export const stockHeatmapConfig = {
  ...stockHeatmapBaseConfig,
  exchanges: ["NASDAQ", "NYSE", "AMEX"],
  grouping: "sector",
  blockSize: "market_cap_basic",
  blockColor: "change",
  hasTopBar: false,
  isZoomEnabled: true,
  hasSymbolTooltip: true,
} satisfies StockHeatmapProps;

/**
 * Market Overview configuration with default macro tabs.
 */
export const marketOverviewConfig = {
  ...tradingViewBaseConfig,
  showChart: true,
  dateRange: "12M",
  showSymbolLogo: true,
  tabs: [
    {
      title: "Financial",
      originalTitle: "Financial",
      symbols: [
        { s: "NYSE:JPM", d: "JPMorgan Chase" },
        { s: "NYSE:WFC", d: "Wells Fargo" },
        { s: "NYSE:BAC", d: "Bank of America" },
        { s: "NYSE:GS", d: "Goldman Sachs" },
        { s: "NYSE:MS", d: "Morgan Stanley" },
      ],
    },
    {
      title: "Technology",
      originalTitle: "Technology",
      symbols: [
        { s: "NASDAQ:AAPL", d: "Apple" },
        { s: "NASDAQ:MSFT", d: "Microsoft" },
        { s: "NASDAQ:GOOGL", d: "Alphabet" },
        { s: "NASDAQ:NVDA", d: "NVIDIA" },
        { s: "NASDAQ:AMD", d: "AMD" },
      ],
    },
    {
      title: "Services",
      originalTitle: "Services",
      symbols: [
        { s: "NASDAQ:AMZN", d: "Amazon" },
        { s: "NYSE:WMT", d: "Walmart" },
        { s: "NYSE:HD", d: "Home Depot" },
        { s: "NYSE:MCD", d: "McDonald's" },
        { s: "NASDAQ:NFLX", d: "Netflix" },
      ],
    },
    {
      title: "Medical",
      originalTitle: "Medical",
      symbols: [
        { s: "NYSE:JNJ", d: "Johnson & Johnson" },
        { s: "NYSE:UNH", d: "UnitedHealth" },
        { s: "NYSE:LLY", d: "Eli Lilly" },
        { s: "NYSE:PFE", d: "Pfizer" },
        { s: "NYSE:MRK", d: "Merck" },
        { s: "NASDAQ:AMGN", d: "Amgen" },
      ],
    },
  ],
} satisfies MarketOverviewProps;

/**
 * Stock Market movers configuration focused on US markets.
 */
export const stockMarketConfig = {
  ...tradingViewBaseConfig,
  exchange: "US",
  showChart: true,
  dateRange: "12M",
  showSymbolLogo: true,
} satisfies StockMarketProps;

/**
 * Top Stories configuration (TradingView Timeline widget).
 */
export const topStoriesConfig = {
  ...tradingViewBaseConfig,
  feedMode: "market",
  market: "stock",
  displayMode: "regular",
} satisfies TimelineProps;
