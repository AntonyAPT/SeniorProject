'use client'

import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { createPortfolio, deletePortfolio, renamePortfolio } from '../actions/portfolio'
import { useNavigation } from '../hooks'
import { useSelectedPortfolio } from '../contexts/SelectedPortfolioContext'
import type { PortfolioWithValue } from './page'
import styles from './portfolios.module.css'

type PortfoliosPageProps = {
  portfolios: PortfolioWithValue[]
  serverError: string | null
}

export function PortfoliosPage({ portfolios, serverError }: PortfoliosPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createName, setCreateName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingPortfolio, setDeletingPortfolio] = useState<PortfolioWithValue | null>(null)
  const { selectedPortfolioId, isHydrated, setSelectedPortfolioId } = useSelectedPortfolio()
  const { navigate } = useNavigation()

  const defaultPortfolioId = useMemo(
    () => portfolios.find((portfolio) => portfolio.is_default)?.id ?? null,
    [portfolios]
  )

  const activePortfolioId = selectedPortfolioId ?? defaultPortfolioId

  useEffect(() => {
    // 1. Wait for localStorage to load
    if (!isHydrated) return
  
    // 2. If no selection exists, set default
    if (!selectedPortfolioId) {
      if (defaultPortfolioId) {
        setSelectedPortfolioId(defaultPortfolioId)
      }
      return
    }
  
    // 3. If selection exists but portfolio was deleted, reset to default
    const selectionExists = portfolios.some((portfolio) => portfolio.id === selectedPortfolioId)
    if (!selectionExists) {
      setSelectedPortfolioId(defaultPortfolioId)
    }
  }, [defaultPortfolioId, isHydrated, portfolios, selectedPortfolioId, setSelectedPortfolioId])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

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

    if (result.error) {
      setError(result.error)
    } else if (activePortfolioId === deletingPortfolioId) {
      const fallbackPortfolioId =
        portfolios.find((portfolio) => portfolio.id !== deletingPortfolioId && portfolio.is_default)?.id ??
        portfolios.find((portfolio) => portfolio.id !== deletingPortfolioId)?.id ??
        null

      setSelectedPortfolioId(fallbackPortfolioId)
    }

    setDeletingPortfolio(null)
    setIsSubmitting(false)
  }

  const startRenaming = (portfolio: PortfolioWithValue) => {
    setRenamingId(portfolio.id)
    setRenameValue(portfolio.name || '')
    setError(null)
  }

  const cancelRenaming = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const handleSelectPortfolio = (portfolioId: string) => {
    setSelectedPortfolioId(portfolioId)
    //navigate('portfolio', { id: portfolioId })
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Your Portfolios</h1>
          <p className={styles.description}>
            You can have multiple portfolios in [STONKS]. Each can be used for a different purpose, like
            Savings, Spending, Shopping, etc.
          </p>
        </div>

        {/* Server Error Message */}
        {serverError && (
          <div className={styles.serverError}>
            An error occurred while loading portfolios. Please refresh the page.
          </div>
        )}

        {/* Client Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Portfolio List */}
        <div className={styles.portfolioList}>
          {portfolios.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>No portfolios yet. Create your first one!</p>
            </div>
          ) : (
            portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className={`${styles.portfolioItem} ${
                  activePortfolioId === portfolio.id ? styles.portfolioItemSelected : ''
                } ${
                  renamingId !== portfolio.id ? styles.portfolioItemSelectable : ''
                }`}
                onClick={() => {
                  if (renamingId !== portfolio.id) {
                    handleSelectPortfolio(portfolio.id)
                  }
                }}
              >
                {renamingId === portfolio.id ? (
                  /* Rename Mode */
                  <form
                    className={styles.renameForm}
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleRename(portfolio.id)
                    }}
                  >
                    <div className={styles.portfolioIcon}>
                      <Briefcase size={20} />
                    </div>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className={styles.renameInput}
                      placeholder="Portfolio name"
                      autoFocus
                      disabled={isSubmitting}
                    />
                    <div className={styles.renameActions}>
                      <button
                        type="submit"
                        className={`${styles.smallButton} ${styles.saveButton}`}
                        disabled={isSubmitting || !renameValue.trim()}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.smallButton} ${styles.cancelButton}`}
                        onClick={cancelRenaming}
                        disabled={isSubmitting}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Mode */
                  <>
                    <div className={styles.portfolioInfo}>
                      <div className={styles.portfolioIcon}>
                        <Briefcase size={20} />
                      </div>
                      <div className={styles.portfolioDetails}>
                        <div className={styles.portfolioName}>
                          {portfolio.name}
                          {activePortfolioId === portfolio.id && (
                            <span className={styles.selectedBadge}>Selected</span>
                          )}
                          {portfolio.is_default && (
                            <span className={styles.defaultBadge}>(Default)</span>
                          )}
                        </div>
                        <div className={styles.portfolioValue}>
                          {formatCurrency(portfolio.totalValue)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={(event) => {
                          event.stopPropagation()
                          startRenaming(portfolio)
                        }}
                        title="Rename portfolio"
                      >
                        <Pencil size={16} />
                      </button>
                      {/* Hide delete button for default portfolio */}
                      {!portfolio.is_default && (
                        <button
                          type="button"
                          className={`${styles.actionButton} ${styles.delete}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeletingPortfolio(portfolio)
                          }}
                          title="Delete portfolio"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create Button */}
        <button
          className={styles.createButton}
          onClick={() => {
            setIsCreating(true)
            setError(null)
          }}
          disabled={isCreating}
        >
          <Plus size={18} />
          Create New Portfolio
        </button>

        {/* Create Form Modal */}
        {isCreating && (
          <div className={styles.createFormOverlay} onClick={() => setIsCreating(false)}>
            <div className={styles.createFormCard} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.createFormTitle}>Create New Portfolio</h2>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className={styles.createFormInput}
                placeholder="Portfolio name"
                autoFocus
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
              />
              <div className={styles.createFormActions}>
                <button
                  className={styles.createFormSubmit}
                  onClick={handleCreate}
                  disabled={isSubmitting || !createName.trim()}
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
                <button
                  className={styles.createFormCancel}
                  onClick={() => {
                    setIsCreating(false)
                    setCreateName('')
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingPortfolio && (
          <div className={styles.deleteConfirmOverlay} onClick={() => setDeletingPortfolio(null)}>
            <div className={styles.deleteConfirmCard} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.deleteConfirmTitle}>Delete Portfolio</h2>
              <p className={styles.deleteConfirmText}>
                Are you sure you want to delete "{deletingPortfolio.name}"? 
                This will also delete all stocks in this portfolio. This action cannot be undone.
              </p>
              <div className={styles.deleteConfirmActions}>
                <button
                  className={styles.deleteConfirmButton}
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  className={styles.deleteCancelButton}
                  onClick={() => setDeletingPortfolio(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
