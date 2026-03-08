import { useState } from 'react'
import { createPortfolio, deletePortfolio, renamePortfolio } from '../../actions/portfolio'
import type { PortfolioWithValue, SetPortfolioIdFn } from '../types'

// Input type 
type UsePortfolioActionsParams = {
  portfolios: PortfolioWithValue[]
  activePortfolioId: string | null
  setSelectedPortfolioId: SetPortfolioIdFn
}

// hook signature (parameters used for handling deletion behavior)
export function usePortfolioActions({
  portfolios,
  activePortfolioId,
  setSelectedPortfolioId,
}: UsePortfolioActionsParams) {
  // state declarations
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createName, setCreateName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false) // Shared across all CUD operations (disables buttons in the UI while an operation is in progress)
  const [renamingId, setRenamingId] = useState<string | null>(null) // Tracks which portfolio is being renamed
  const [renameValue, setRenameValue] = useState('')
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioWithValue | null>(null) // determines if a deletion is in progress (null needed)

  const handleCreate = async () => {
    if (!createName.trim()) return

    setIsSubmitting(true)
    setError(null)

    const result = await createPortfolio(createName.trim())

    if (result.error) {
      setError(result.error)
    } else {
      setIsCreating(false)
      setCreateName('')
    }

    setIsSubmitting(false)
  }

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return

    setIsSubmitting(true)
    setError(null)

    const result = await renamePortfolio(id, renameValue.trim())

    if (result.error) {
      setError(result.error)
    } else {
      // exit rename mode for the portfolio row and clear input
      setRenamingId(null) 
      setRenameValue('')
    }

    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!deletingPortfolio) return

    const deletingPortfolioId = deletingPortfolio.id
    setIsSubmitting(true)
    setError(null)

    const result = await deletePortfolio(deletingPortfolioId)

    // Guard clause example!
    if (result.error) { 
      setError(result.error)
    // After a successful deletion, it checks whether the deleted portfolio was the currently selected one. 
    // If so, it needs to pick a fallback:
    } else if (activePortfolioId === deletingPortfolioId) {
      const fallbackPortfolio =
        portfolios.find((portfolio) => portfolio.id !== deletingPortfolioId && portfolio.is_default) ??
        portfolios.find((portfolio) => portfolio.id !== deletingPortfolioId) ??
        null

      setSelectedPortfolioId(fallbackPortfolio?.id ?? null, fallbackPortfolio?.name ?? null)
    }

    setDeletingPortfolio(null)
    setIsSubmitting(false)
  }

  // synch helpers
  //pre-fills the rename input line with the current name
  const startRenaming = (portfolio: PortfolioWithValue) => {
    setRenamingId(portfolio.id)
    setRenameValue(portfolio.name || '')
    setError(null)
  }

  const cancelRenaming = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  // Only the operations that involve async server calls or multi-step state coordination
  // (handleCreate, handleRename, handleDelete, startRenaming, cancelRenaming) get their own named handlers.
  return {
    error,
    isCreating,
    createName,
    isSubmitting,
    renamingId,
    renameValue,
    deletingPortfolio,
    setIsCreating,
    setCreateName,
    setRenameValue,
    setDeletingPortfolio,
    handleCreate,
    handleRename,
    handleDelete,
    startRenaming,
    cancelRenaming,
    setError,
  }
}
