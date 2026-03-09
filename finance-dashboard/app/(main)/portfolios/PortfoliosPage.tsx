'use client'

import { useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useSelectedPortfolio } from '../contexts/SelectedPortfolioContext'
import type { PortfolioWithValue } from './types'
import { PortfolioItem } from './components/PortfolioItem'
import { CreatePortfolioModal } from './components/CreatePortfolioModal'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { usePortfolioActions } from './hooks/usePortfolioActions'
import styles from './portfolios.module.css'

type PortfoliosPageProps = {
  portfolios: PortfolioWithValue[]
  serverError: string | null
}

export function PortfoliosPage({ portfolios, serverError }: PortfoliosPageProps) {
  const { selectedPortfolioId, isHydrated, setSelectedPortfolioId } = useSelectedPortfolio()

  const defaultPortfolioId = useMemo(
    () => portfolios.find((portfolio) => portfolio.is_default)?.id ?? null,
    [portfolios]
  )
  const defaultPortfolioName = useMemo(
    () => portfolios.find((portfolio) => portfolio.is_default)?.name ?? null,
    [portfolios]
  )

  const activePortfolioId = selectedPortfolioId ?? defaultPortfolioId

  const {
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
  } = usePortfolioActions({
    portfolios,
    activePortfolioId,
    setSelectedPortfolioId,
  })

  useEffect(() => {
    if (!isHydrated) return

    if (!selectedPortfolioId) {
      if (defaultPortfolioId) {
        setSelectedPortfolioId(defaultPortfolioId, defaultPortfolioName)
      }
      return
    }
  
    // 3. If selection exists but portfolio was deleted, reset to default
    const selectionExists = portfolios.some((portfolio) => portfolio.id === selectedPortfolioId)
    if (!selectionExists) {
      setSelectedPortfolioId(defaultPortfolioId, defaultPortfolioName)
    }
  }, [defaultPortfolioId, defaultPortfolioName, isHydrated, portfolios, selectedPortfolioId, setSelectedPortfolioId])

  const handleSelectPortfolio = (portfolioId: string) => {
    const selectedPortfolioName =
      portfolios.find((portfolio) => portfolio.id === portfolioId)?.name ?? null

    setSelectedPortfolioId(portfolioId, selectedPortfolioName)
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
              <PortfolioItem
                key={portfolio.id}
                portfolio={portfolio}
                isSelected={activePortfolioId === portfolio.id}
                isRenaming={renamingId === portfolio.id}
                renameValue={renameValue}
                isSubmitting={isSubmitting}
                onSelect={handleSelectPortfolio}
                onRenameValueChange={setRenameValue}
                onRenameSubmit={handleRename}
                onRenameCancel={cancelRenaming}
                onStartRenaming={startRenaming}
                onStartDeleting={setDeletingPortfolio}
              />
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
          <CreatePortfolioModal
            createName={createName}
            isSubmitting={isSubmitting}
            onCreateNameChange={setCreateName}
            onCreate={handleCreate}
            onClose={() => {
              setIsCreating(false)
              setCreateName('')
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingPortfolio && (
          <DeleteConfirmModal
            portfolioName={deletingPortfolio.name}
            isSubmitting={isSubmitting}
            onConfirm={handleDelete}
            onClose={() => setDeletingPortfolio(null)}
          />
        )}
      </div>
    </div>
  )
}
