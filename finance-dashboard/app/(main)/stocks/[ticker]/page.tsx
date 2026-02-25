import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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

        <Link
          href="/stocks"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stocks
        </Link>

        <StockDetailWidgets symbol={symbol} />

        <p className="text-center text-xs text-slate-600 pb-4">
          Market data and widgets by TradingView · Not financial advice
        </p>

      </div>
    </div>
  );
}
