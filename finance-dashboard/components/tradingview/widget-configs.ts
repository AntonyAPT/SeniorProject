import type {
  CompanyProfileProps,
  FundamentalDataProps,
  MarketOverviewProps,
  MiniChartProps,
  StockHeatmapProps,
  StockMarketProps,
  SymbolInfoProps,
  SymbolOverviewProps,
  TechnicalAnalysisProps,
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
  isZoomEnabled: false,
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
        // { s: "NASDAQ:AMGN", d: "Amgen" },
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

/**
 * Returns a SymbolInfo config for the given stock symbol.
 *
 * @param symbol - TradingView-formatted symbol (e.g. "NASDAQ:AAPL" or bare "AAPL").
 */
export function symbolInfoConfig(symbol: string): SymbolInfoProps {
  return {
    ...tradingViewBaseConfig,
    symbol,
  };
}

/**
 * Returns a TechnicalAnalysis config for the given stock symbol.
 * Defaults to daily interval with all interval tabs visible.
 *
 * @param symbol - TradingView-formatted symbol.
 */
export function technicalAnalysisConfig(symbol: string): TechnicalAnalysisProps {
  return {
    ...tradingViewBaseConfig,
    symbol,
    interval: "1D",
    showIntervalTabs: true,
  };
}

/**
 * Returns a FundamentalData config for the given stock symbol.
 *
 * @param symbol - TradingView-formatted symbol.
 */
export function fundamentalDataConfig(symbol: string): FundamentalDataProps {
  return {
    ...tradingViewBaseConfig,
    symbol,
  };
}

/**
 * Returns a CompanyProfile config for the given stock symbol.
 *
 * @param symbol - TradingView-formatted symbol.
 */
export function companyProfileConfig(symbol: string): CompanyProfileProps {
  return {
    ...tradingViewBaseConfig,
    symbol,
  };
}

/**
 * Returns a SymbolOverview config for the given stock symbol.
 * Renders as an area chart with volume bars.
 *
 * SymbolOverview expects `symbols` as a nested array: [[displayName, symbol]].
 *
 * @param symbol - TradingView-formatted symbol.
 */
export function symbolOverviewConfig(symbol: string): SymbolOverviewProps {
  return {
    ...tradingViewBaseConfig,
    symbols: [[symbol, symbol]],
    chartType: "area",
    showVolume: true,
    dateFormat: "dd MMM 'yy",
  };
}

/**
 * Returns a MiniChart config for the given stock symbol.
 * Intended for compact contexts (e.g. modals) where a full chart would be overwhelming.
 */
export function miniChartConfig(symbol: string): MiniChartProps {
  return {
    ...tradingViewBaseConfig,
    symbol,
    dateRange: "1M",
    chartOnly: false,
  };
}
