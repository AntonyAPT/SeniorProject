import { StockDetailWidgets } from "@/components/tradingview"; // '@' means starting from the project root
import { BuyAndWatchlist, QuarterlyChartsPanel, QuarterlyDataPanel } from "@/components/stocks";
import { getQuarterlyFundamentals } from "@/lib/quarterly";
import { QuarterlyFundamentalRow } from "@/types/quarterly";

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();
  let quarterlyRows: QuarterlyFundamentalRow[] = [];

  try {
    quarterlyRows = await getQuarterlyFundamentals(symbol);
  } catch {
    quarterlyRows = [];
  }

  return (
    <div className="min-h-screen bg-page text-foreground">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <StockDetailWidgets symbol={symbol} topLeftSlot={<BuyAndWatchlist symbol={symbol} />} />
        <QuarterlyDataPanel symbol={symbol} rows={quarterlyRows} />
        <QuarterlyChartsPanel symbol={symbol} rows={quarterlyRows} />
      </div>
    </div>
  );
}
