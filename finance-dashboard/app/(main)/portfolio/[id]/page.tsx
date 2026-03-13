import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AddStockButton } from '../../components/AddStockButton'
import { TransactionLedger } from '../components/TransactionLedger'
import type { TickerGroup } from '../components/TransactionLedger'
import { PortfolioInsights } from '../components/PortfolioInsights'

type Props = {
  params: Promise<{ id: string }>
}

async function fetchCurrentPrices(tickers: string[]): Promise<Record<string, number>> {
  const apiKey = process.env.FINNHUB_API_KEY

  if (!apiKey || tickers.length === 0) {
    return {}
  }

  const quotes = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`,
          { cache: 'no-store' }
        )

        if (!res.ok) {
          return [ticker, 0] as const
        }

        const data = await res.json()
        return [ticker, Number(data.c ?? 0)] as const
      } catch {
        return [ticker, 0] as const
      }
    })
  )

  return Object.fromEntries(quotes)
}

type OpenLot = {
  remainingQuantity: number
  transactionRef: TickerGroup['transactions'][number]
}

// When a user visits /portfolio/abc-123, Next.js matches this file and passes { id: "abc-123" } as params.
export default async function PortfolioPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // function never continues past this line if there's no user. This is a hard gate clause 
    redirect('/sign-in')
  }

  // Fetch the specific portfolio
  // If someone guesses another user's portfolio UUID in the URL, this query returns nothing and notFound() renders
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select('id, name, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !portfolio) {
    notFound()
  }

  // Fetch portfolio items oldest first so cost basis can be updated in transaction order.
  const { data: items } = await supabase
    .from('portfolio_items')
    .select('id, stock_ticker, quantity, buy_price, buy_date, transaction_type')
    .eq('portfolio_id', id)
    .order('buy_date', { ascending: true })

  // Group items by ticker while preserving the remaining cost basis after sells.
  const groupMap = new Map<string, TickerGroup>()
  const openLotMap = new Map<string, OpenLot[]>()

  for (const item of items ?? []) {
    const action = item.transaction_type as 'buy' | 'sell'
    const tx = {
      id: item.id,
      action,
      quantity: item.quantity,
      remainingQuantity: action === 'buy' ? item.quantity : 0,
      buyPrice: item.buy_price,
      totalCost: item.quantity * item.buy_price,
      currentValue: null,
      unrealizedGain: null,
      unrealizedGainPct: null,
      buyDate: item.buy_date,
    }

    if (!groupMap.has(item.stock_ticker)) {
      groupMap.set(item.stock_ticker, {
        ticker: item.stock_ticker,
        totalShares: 0,
        totalInvested: 0,
        currentPrice: null,
        currentValue: null,
        unrealizedGain: null,
        unrealizedGainPct: null,
        transactions: [],
      })

      openLotMap.set(item.stock_ticker, [])
    }

    const group = groupMap.get(item.stock_ticker)!
    const openLots = openLotMap.get(item.stock_ticker)!

    if (action === 'buy') {
      group.totalShares += item.quantity
      group.totalInvested += tx.totalCost
      openLots.push({
        remainingQuantity: item.quantity,
        transactionRef: tx,
      })
    } else {
      let sharesToSell = item.quantity

      while (sharesToSell > 0 && openLots.length > 0) {
        const lot = openLots[0]
        const matchedShares = Math.min(sharesToSell, lot.remainingQuantity)

        lot.remainingQuantity -= matchedShares
        lot.transactionRef.remainingQuantity -= matchedShares
        group.totalShares -= matchedShares
        group.totalInvested -= matchedShares * lot.transactionRef.buyPrice
        sharesToSell -= matchedShares

        if (lot.remainingQuantity === 0) {
          openLots.shift()
        }
      }

      group.totalShares = Math.max(0, group.totalShares)
      group.totalInvested = Math.max(0, group.totalInvested)
    }

    group.transactions.push(tx)
  }

  // Exclude tickers where all shares have been sold so they don't appear in Holdings
  const activeGroups = Array.from(groupMap.values()).filter(
    (g) => g.totalShares > 0
  )

  for (const group of activeGroups) {
    group.transactions.sort((a, b) => new Date(b.buyDate).getTime() - new Date(a.buyDate).getTime())
  }

  const tickers = activeGroups.map((g) => g.ticker)
  let stockRows: Array<{ ticker: string; industry: string | null }> = []
  let quoteMap: Record<string, number> = {}

  if (tickers.length > 0) {
    const [{ data: fetchedStockRows }, fetchedQuoteMap] = await Promise.all([
      supabase.from('stocks').select('ticker, industry').in('ticker', tickers),
      fetchCurrentPrices(tickers),
    ])

    stockRows = (fetchedStockRows ?? []) as Array<{ ticker: string; industry: string | null }>
    quoteMap = fetchedQuoteMap
  }

  const tickerGroups: TickerGroup[] = activeGroups.map((group) => {
    const livePrice = quoteMap[group.ticker]
    const currentPrice = livePrice && livePrice > 0 ? livePrice : null
    const currentValue = currentPrice === null ? null : currentPrice * group.totalShares
    const unrealizedGain = currentValue === null ? null : currentValue - group.totalInvested
    const unrealizedGainPct =
      unrealizedGain === null || group.totalInvested <= 0
        ? null
        : (unrealizedGain / group.totalInvested) * 100

    return {
      ...group,
      currentPrice,
      currentValue,
      unrealizedGain,
      unrealizedGainPct,
      transactions: group.transactions.map((tx) => {
        if (tx.action !== 'buy' || tx.remainingQuantity <= 0 || currentPrice === null) {
          return {
            ...tx,
            currentValue: null,
            unrealizedGain: null,
            unrealizedGainPct: null,
          }
        }

        const openCostBasis = tx.buyPrice * tx.remainingQuantity
        const lotCurrentValue = currentPrice * tx.remainingQuantity
        const lotUnrealizedGain = lotCurrentValue - openCostBasis

        return {
          ...tx,
          currentValue: lotCurrentValue,
          unrealizedGain: lotUnrealizedGain,
          unrealizedGainPct: openCostBasis > 0 ? (lotUnrealizedGain / openCostBasis) * 100 : null,
        }
      }),
    }
  })

  const industryMap: Record<string, string> = {}
  for (const row of stockRows ?? []) {
    industryMap[row.ticker] = row.industry ?? 'Other'
  }

  return (
    <div className="min-h-screen bg-page text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-widest text-muted font-semibold mb-1">
            Portfolio Summary
          </p>
          <h1 className="text-3xl font-bold italic">
            {portfolio.name}
          </h1>
        </header>
        
        <div className="mt-8 grid gap-6">
          <PortfolioInsights portfolioId={portfolio.id} tickerGroups={tickerGroups} industryMap={industryMap} />
          
          <TransactionLedger tickerGroups={tickerGroups} portfolioId={portfolio.id} />
          
          <AddStockButton />
        </div>
      </div>
    </div>
  )
}
