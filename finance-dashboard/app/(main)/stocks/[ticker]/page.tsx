import { ArrowLeft, BarChart2 } from "lucide-react";
import Link from "next/link";

interface StockPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        <Link
          href="/stocks"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stocks
        </Link>

        <div className="glass rounded-2xl px-6 py-10 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
            <BarChart2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{symbol}</h1>
          <p className="text-slate-400 text-sm">
            Detailed stock view coming soon.
          </p>
        </div>

      </div>
    </div>
  );
}
