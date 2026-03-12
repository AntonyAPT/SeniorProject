import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortfoliosPage } from './PortfoliosPage'
import type { PortfolioWithValue } from './types'

type PortfolioItem = {
  buy_price: number
  quantity: number
  transaction_type: string
}

type PortfolioWithItems = {
  id: string
  name: string
  is_default: boolean
  created_at: string
  portfolio_items: PortfolioItem[]
}

export default async function PortfoliosPageWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch portfolios with their items for value calculation (JOIN query with portfolio_items table)
  const { data: portfolios, error } = await supabase
    .from('portfolios')
    .select('id, name, is_default, created_at, portfolio_items(buy_price, quantity, transaction_type)')
    .eq('user_id', user.id)
    .order('created_at')

  let portfoliosWithValue: PortfolioWithValue[] = []

  if (error) {
    console.error('Error fetching portfolios:', error)
  } else if (portfolios) {
    // Compute cost basis for each portfolio: buys add, sells subtract
    portfoliosWithValue = (portfolios as PortfolioWithItems[]).map((portfolio) => {
      const totalValue = portfolio.portfolio_items.reduce((sum, item) => {
        const cost = item.buy_price * item.quantity
        return item.transaction_type === 'sell' ? sum - cost : sum + cost
      }, 0)

      return {
        id: portfolio.id,
        name: portfolio.name,
        is_default: portfolio.is_default,
        created_at: portfolio.created_at,
        totalValue,
      }
    })
  }

  return <PortfoliosPage portfolios={portfoliosWithValue} serverError={error?.message || null} />
}
