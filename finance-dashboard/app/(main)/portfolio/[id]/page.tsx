import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AddStockButton } from '../../components/AddStockButton'
import { TransactionLedger } from '../components/TransactionLedger'
import type { TickerGroup } from '../components/TransactionLedger'

type Props = {
  params: Promise<{ id: string }>
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

  // Fetch portfolio items ordered by most recent first
  const { data: items } = await supabase
    .from('portfolio_items')
    .select('id, stock_ticker, quantity, buy_price, buy_date')
    .eq('portfolio_id', id)
    .order('buy_date', { ascending: false })

  // Group items by ticker
  const groupMap = new Map<string, TickerGroup>()

  for (const item of items ?? []) {
    const existing = groupMap.get(item.stock_ticker)
    const tx = {
      id: item.id,
      quantity: item.quantity,
      buyPrice: item.buy_price,
      totalCost: item.quantity * item.buy_price,
      buyDate: item.buy_date,
    }

    if (existing) {
      existing.totalShares += item.quantity
      existing.totalInvested += tx.totalCost
      existing.transactions.push(tx)
    } else {
      groupMap.set(item.stock_ticker, {
        ticker: item.stock_ticker,
        totalShares: item.quantity,
        totalInvested: tx.totalCost,
        transactions: [tx],
      })
    }
  }

  const tickerGroups: TickerGroup[] = Array.from(groupMap.values())

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
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
          <section className="p-6 bg-surface rounded-lg border border-border-muted">
            <p className="text-muted-foreground">Chart component placeholder</p>
          </section>
          
          <TransactionLedger tickerGroups={tickerGroups} />
          
          <AddStockButton />
        </div>
      </div>
    </div>
  )
}
