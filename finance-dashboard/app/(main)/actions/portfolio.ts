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
