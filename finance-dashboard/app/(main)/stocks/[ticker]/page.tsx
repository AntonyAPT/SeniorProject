import { StockDetailWidgets } from "@/components/tradingview";

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <StockDetailWidgets symbol={symbol} />
      </div>
    </div>
  );
}
