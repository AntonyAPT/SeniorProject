'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResponse<T> = {
  data: T | null
  error: string | null
}

/**
 * Gets the default portfolio ID for the authenticated user
 */
export async function getDefaultPortfolio(): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: 'You must be logged in to view portfolios' }
    }

    const { data, error } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (error || !data) {
      console.error('Error fetching default portfolio:', error)
      return { data: null, error: 'No default portfolio found' }
    }

    return { data: { id: data.id }, error: null }
  } catch (err) {
    console.error('Unexpected error fetching default portfolio:', err)
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
