'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// The return type always resolves to either { data: T, error: null } on success 
// or { data: null, error: "message" } on failure. 
// This means the caller never has to try/catch -> Promise always resolves to something -> no error page; 
// it just checks result.error.
type ActionResponse<T> = {
  data: T | null
  error: string | null
}

/**
 * Gets the default portfolio ID for the authenticated user
 */
export async function getDefaultPortfolio(): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to view portfolios' }
    }

    const { data, error } = await supabase
      .from('portfolios')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (error || !data) {
      console.error('Error fetching default portfolio:', error)
      return { data: null, error: 'No default portfolio found' }
    }

    return { data: { id: data.id, name: data.name }, error: null }
  } catch (err) {
    console.error('Unexpected error fetching default portfolio:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Gets a portfolio by ID for the authenticated user
 */
export async function getPortfolioById(id: string): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to view portfolios' }
    }

    const { data, error } = await supabase
      .from('portfolios')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return { data: null, error: 'Portfolio not found' }
    }

    return { data: { id: data.id, name: data.name }, error: null }
  } catch (err) {
    console.error('Unexpected error fetching portfolio by ID:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Creates a new portfolio for the authenticated user
 */
export async function createPortfolio(name: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to create a portfolio' }
    }

    if (!name || name.trim().length === 0) {
      return { data: null, error: 'Portfolio name is required' }
    }

    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        name: name.trim(),
        user_id: user.id,
        is_default: false,
      })
      .select('id')
      .single() // <--- returns { id: "..." } instead of [{ id: "..." }]

    if (error) {
      console.error('Error creating portfolio:', error)
      return { data: null, error: 'Failed to create portfolio. Please try again.' }
    }

    revalidatePath('/portfolios')
    return { data: { id: data.id }, error: null }
  } catch (err) {
    console.error('Unexpected error creating portfolio:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Deletes a portfolio by ID (only if not the default portfolio)
 */
export async function deletePortfolio(id: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to delete a portfolio' }
    }

    // First, check if this portfolio exists and belongs to the user
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !portfolio) {
      return { data: null, error: 'Portfolio not found' }
    }

    // Prevent deletion of default portfolio
    if (portfolio.is_default) {
      return { data: null, error: 'Cannot delete the default portfolio' }
    }

    // Delete the portfolio (portfolio_items will cascade delete)
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting portfolio:', deleteError)
      return { data: null, error: 'Failed to delete portfolio. Please try again.' }
    }

    revalidatePath('/portfolios')
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('Unexpected error deleting portfolio:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Adds a stock to a portfolio, fetching the current price from Finnhub
 */
export async function addStockToPortfolio(
  portfolioId: string,
  ticker: string,
  quantity: number
): Promise<ActionResponse<{ id: string; buy_price: number; buy_date: string; transaction_type: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to add stocks' }
    }

    // Verify the user owns this portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolio) {
      return { data: null, error: 'Portfolio not found or access denied' }
    }

    // main reason why this functionality is a server action: API ket does not get exposed to the client 
    // not that useful safeguard but whatever AI slop
    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      return { data: null, error: 'Stock price service not configured' }
    }

    // Check if the stock row already exists to avoid an unnecessary /profile2 call.
    // Companies rarely change industries, so profile data only needs to be fetched once.
    const { data: existingStock } = await supabase
      .from('stocks')
      .select('ticker')
      .eq('ticker', ticker)
      .maybeSingle()

    let currentPrice = 0

    if (existingStock) {
      // Stock is already known — only fetch the latest price
      const quoteRes = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`,
        { cache: 'no-store' }
      )
      if (!quoteRes.ok) {
        return { data: null, error: 'Failed to fetch stock price' }
      }
      const quoteData = await quoteRes.json()
      currentPrice = quoteData.c ?? 0
    } else {
      // New stock — fetch price and company profile in parallel
      const [quoteRes, profileRes] = await Promise.all([
        fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`,
          { cache: 'no-store' }
        ),
        fetch(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`,
          { cache: 'no-store' }
        ),
      ])

      if (!quoteRes.ok) {
        return { data: null, error: 'Failed to fetch stock price' }
      }

      const quoteData = await quoteRes.json()
      currentPrice = quoteData.c ?? 0

      let profileData: Record<string, string> = {}
      if (profileRes.ok) {
        profileData = await profileRes.json()
      }

      // Insert the new stock row; || catches empty strings that ?? would pass through
      const { error: stockError } = await supabase
        .from('stocks')
        .insert({
          ticker,
          company_name: profileData.name ?? null,
          industry: profileData.finnhubIndustry || 'Other',
        })

      if (stockError) {
        console.error('Error inserting stock:', stockError)
        return { data: null, error: 'Failed to save stock data' }
      }
    }

    if (currentPrice === 0) {
      return { data: null, error: 'Unable to fetch current price.' }
    }

    // "2026-03-09T21:30:00.000Z"; UTC 
    const buyDate = new Date().toISOString()

    // Insert the portfolio item
    const { data: item, error: insertError } = await supabase
      .from('portfolio_items')
      .insert({
        portfolio_id: portfolioId,
        stock_ticker: ticker,
        quantity,
        buy_price: currentPrice,
        buy_date: buyDate,
        transaction_type: 'buy',
      })
      // chained queries so that the client doesn't have to make a second fetch to get the data that was 
      // just inserted into the table
      .select('id, buy_price, buy_date, transaction_type')
      .single()

    if (insertError || !item) {
      console.error('Error inserting portfolio item:', insertError)
      return { data: null, error: 'Failed to add stock to portfolio' }
    }

    // tells Next.js to flush the server-side cache for those pages so 
    // the next visit re-runs the server component and shows the new holding. 
    // Without this, a user could add a stock and then visit their portfolio page 
    // and not see it until the cache expired on its own.
    revalidatePath(`/portfolio/${portfolioId}`)
    revalidatePath('/portfolios')

    return { data: { id: item.id, buy_price: item.buy_price, buy_date: item.buy_date, transaction_type: item.transaction_type }, error: null }
  } catch (err) {
    console.error('Unexpected error adding stock to portfolio:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Sells (records a sell transaction for) shares of a stock in a portfolio.
 * Validates that the user holds enough shares before inserting the sell row.
 * Fetches the current market price from Finnhub for the transaction price.
 */
export async function sellStockFromPortfolio(
  portfolioId: string,
  ticker: string,
  quantity: number
): Promise<ActionResponse<{ id: string; buy_price: number; buy_date: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to sell stocks' }
    }

    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolio) {
      return { data: null, error: 'Portfolio not found or access denied' }
    }

    // Compute net share count to prevent overselling
    const { data: items, error: itemsError } = await supabase
      .from('portfolio_items')
      .select('quantity, transaction_type')
      .eq('portfolio_id', portfolioId)
      .eq('stock_ticker', ticker)

    if (itemsError) {
      return { data: null, error: 'Failed to validate current holdings' }
    }

    const netShares = (items ?? []).reduce((acc, item) => {
      return item.transaction_type === 'sell' ? acc - item.quantity : acc + item.quantity
    }, 0)

    if (quantity > netShares) {
      return { data: null, error: `You only hold ${netShares} share${netShares === 1 ? '' : 's'} of ${ticker}` }
    }

    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      return { data: null, error: 'Stock price service not configured' }
    }

    const quoteRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`,
      { cache: 'no-store' }
    )
    if (!quoteRes.ok) {
      return { data: null, error: 'Failed to fetch stock price' }
    }

    const quoteData = await quoteRes.json()
    const currentPrice: number = quoteData.c ?? 0

    if (currentPrice === 0) {
      return { data: null, error: 'Unable to fetch current price.' }
    }

    const sellDate = new Date().toISOString()

    const { data: item, error: insertError } = await supabase
      .from('portfolio_items')
      .insert({
        portfolio_id: portfolioId,
        stock_ticker: ticker,
        quantity,
        buy_price: currentPrice,
        buy_date: sellDate,
        transaction_type: 'sell',
      })
      .select('id, buy_price, buy_date')
      .single()

    if (insertError || !item) {
      console.error('Error inserting sell transaction:', insertError)
      return { data: null, error: 'Failed to record sell transaction' }
    }

    revalidatePath(`/portfolio/${portfolioId}`)
    revalidatePath('/portfolios')

    return { data: { id: item.id, buy_price: item.buy_price, buy_date: item.buy_date }, error: null }
  } catch (err) {
    console.error('Unexpected error selling stock:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ===== Performance History =====

export type PerformanceRange = '1W' | '1M' | '3M' | '6M' | '1Y'

export type PerformancePoint = {
  date: string
  value: number
}

const RANGE_DAYS: Record<PerformanceRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
}

/**
 * Fetches daily closing prices from Yahoo Finance for a single ticker.
 *
 * Used instead of Finnhub's candle endpoint because Yahoo Finance is free,
 * requires no API key, and reliably returns US stock data without tier restrictions.
 * Returns an empty array on any error so callers can proceed with partial data.
 */
async function fetchYahooCandle(
  ticker: string,
  fromUnix: number,
  toUnix: number
): Promise<{ t: number; c: number }[]> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${fromUnix}&period2=${toUnix}`
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return []
    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result?.timestamp?.length) return []
    const closes: (number | null)[] = result.indicators.quote[0].close ?? []
    return (result.timestamp as number[])
      .map((t: number, i: number) => ({ t, c: closes[i] ?? null }))
      .filter((p): p is { t: number; c: number } => p.c !== null && p.c > 0)
  } catch {
    return []
  }
}

/**
 * Computes the historical daily value of a portfolio for a given time range.
 *
 * Reconstructs share counts per ticker for every trading day by replaying
 * all transactions in chronological order. Historical closing prices come
 * from Yahoo Finance (free, no API key). Today's value, if not yet a closed
 * candle, is appended using Finnhub's live /quote endpoint so portfolios
 * bought the same day show up immediately.
 *
 * No cash balance is included — value is purely equity (shares × price).
 *
 * @param portfolioId - The portfolio to compute performance for.
 * @param range - Time window: '1W' | '1M' | '3M' | '6M' | '1Y'.
 * @returns Ordered array of { date (YYYY-MM-DD), value (USD) } points.
 */
export async function getPortfolioPerformance(
  portfolioId: string,
  range: PerformanceRange
): Promise<ActionResponse<PerformancePoint[]>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to view performance' }
    }

    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single()

    if (portfolioError || !portfolio) {
      return { data: null, error: 'Portfolio not found or access denied' }
    }

    const { data: items, error: itemsError } = await supabase
      .from('portfolio_items')
      .select('stock_ticker, quantity, buy_date, transaction_type')
      .eq('portfolio_id', portfolioId)
      .order('buy_date', { ascending: true })

    if (itemsError) {
      return { data: null, error: 'Failed to load transactions' }
    }

    if (!items || items.length === 0) {
      return { data: [], error: null }
    }

    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      return { data: null, error: 'Stock price service not configured' }
    }

    const now = new Date()
    const toUnix = Math.floor(now.getTime() / 1000)
    const fromUnix = Math.floor((now.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000) / 1000)

    const uniqueTickers = [...new Set(items.map((i) => i.stock_ticker))]

    // ===== Historical Prices (Yahoo Finance) =====

    const candleResults = await Promise.all(
      uniqueTickers.map(async (ticker) => ({
        ticker,
        candles: await fetchYahooCandle(ticker, fromUnix, toUnix),
      }))
    )

    // Build price map: ticker → { midnight-UTC-ms → closePrice }
    const priceMap = new Map<string, Map<number, number>>()
    for (const { ticker, candles } of candleResults) {
      if (candles.length === 0) continue
      const dayMap = new Map<number, number>()
      for (const { t, c } of candles) {
        const d = new Date(t * 1000)
        const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
        dayMap.set(midnight, c)
      }
      priceMap.set(ticker, dayMap)
    }

    const tradingDaySet = new Set<number>()
    for (const dayMap of priceMap.values()) {
      for (const ts of dayMap.keys()) tradingDaySet.add(ts)
    }
    const tradingDays = Array.from(tradingDaySet).sort((a, b) => a - b)

    // Normalize transactions to midnight UTC for date-aligned comparison
    const transactions = items.map((item) => {
      const d = new Date(item.buy_date)
      return {
        ticker: item.stock_ticker,
        quantity: item.quantity,
        type: item.transaction_type as 'buy' | 'sell',
        ts: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
      }
    })

    // ===== Replay Holdings Day by Day =====

    const holdings = new Map<string, number>()
    let txIndex = 0
    const points: PerformancePoint[] = []

    for (const dayTs of tradingDays) {
      while (txIndex < transactions.length && transactions[txIndex].ts <= dayTs) {
        const tx = transactions[txIndex]
        const current = holdings.get(tx.ticker) ?? 0
        holdings.set(tx.ticker, tx.type === 'sell' ? current - tx.quantity : current + tx.quantity)
        txIndex++
      }

      let dayValue = 0
      for (const [ticker, shares] of holdings) {
        if (shares <= 0) continue
        const price = priceMap.get(ticker)?.get(dayTs)
        if (price !== undefined) dayValue += shares * price
      }

      if (dayValue === 0) continue
      points.push({ date: new Date(dayTs).toISOString().slice(0, 10), value: dayValue })
    }

    // ===== Today's Live Value (Finnhub /quote) =====
    //
    // Yahoo Finance only returns closed-day candles, so the current day is absent
    // while the market is open. We fetch live quotes and append "today" so portfolios
    // show a meaningful value regardless of whether the market has closed yet.

    const todayDateStr = now.toISOString().slice(0, 10)
    const lastPointDate = points.at(-1)?.date ?? null

    // Apply any transactions that occurred after the last candle day (e.g. today's buys)
    while (txIndex < transactions.length) {
      const tx = transactions[txIndex]
      const current = holdings.get(tx.ticker) ?? 0
      holdings.set(tx.ticker, tx.type === 'sell' ? current - tx.quantity : current + tx.quantity)
      txIndex++
    }

    const currentTickers = [...holdings.entries()]
      .filter(([, shares]) => shares > 0)
      .map(([ticker]) => ticker)

    // Only fetch live quotes when today isn't already covered by a closed candle
    if (currentTickers.length > 0 && lastPointDate !== todayDateStr) {
      const quoteResults = await Promise.all(
        currentTickers.map(async (ticker) => {
          try {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`,
              { cache: 'no-store' }
            )
            if (!res.ok) return { ticker, price: 0 }
            const data = await res.json()
            return { ticker, price: (data.c ?? 0) as number }
          } catch {
            return { ticker, price: 0 }
          }
        })
      )

      let todayValue = 0
      for (const { ticker, price } of quoteResults) {
        if (price <= 0) continue
        const shares = holdings.get(ticker) ?? 0
        if (shares > 0) todayValue += shares * price
      }

      if (todayValue > 0) {
        points.push({ date: todayDateStr, value: todayValue })
      }
    }

    return { data: points, error: null }
  } catch (err) {
    console.error('Unexpected error computing portfolio performance:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Renames a portfolio by ID
 */
export async function renamePortfolio(id: string, name: string): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to rename a portfolio' }
    }

    if (!name || name.trim().length === 0) {
      return { data: null, error: 'Portfolio name is required' }
    }

    // Verify ownership and update in one query
    const { error } = await supabase
      .from('portfolios')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error renaming portfolio:', error)
      return { data: null, error: 'Failed to rename portfolio. Please try again.' }
    }

    revalidatePath('/portfolios')
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('Unexpected error renaming portfolio:', err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}
