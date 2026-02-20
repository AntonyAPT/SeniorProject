import { Briefcase, Check, Pencil, Trash2, X } from 'lucide-react'
import type { PortfolioWithValue } from '../types'
import styles from '../portfolios.module.css'

type PortfolioItemProps = {
  portfolio: PortfolioWithValue
  isSelected: boolean
  isRenaming: boolean
  renameValue: string
  isSubmitting: boolean
  onSelect: (portfolioId: string) => void
  onRenameValueChange: (value: string) => void
  onRenameSubmit: (id: string) => void
  onRenameCancel: () => void
  onStartRenaming: (portfolio: PortfolioWithValue) => void
  onStartDeleting: (portfolio: PortfolioWithValue) => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function PortfolioItem({
  portfolio,
  isSelected,
  isRenaming,
  renameValue,
  isSubmitting,
  onSelect,
  onRenameValueChange,
  onRenameSubmit,
  onRenameCancel,
  onStartRenaming,
  onStartDeleting,
}: PortfolioItemProps) {
  return (
    <div
      className={`${styles.portfolioItem} ${isSelected ? styles.portfolioItemSelected : ''} ${
        !isRenaming ? styles.portfolioItemSelectable : ''
      }`}
      onClick={() => {
        if (!isRenaming) {
          onSelect(portfolio.id)
        }
      }}
    >
      {isRenaming ? (
        <form
          className={styles.renameForm}
          onSubmit={(e) => {
            e.preventDefault()
            onRenameSubmit(portfolio.id)
          }}
        >
          <div className={styles.portfolioIcon}>
            <Briefcase size={20} />
          </div>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
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
              onClick={onRenameCancel}
              disabled={isSubmitting}
            >
              <X size={14} />
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.portfolioInfo}>
            <div className={styles.portfolioIcon}>
              <Briefcase size={20} />
            </div>
            <div className={styles.portfolioDetails}>
              <div className={styles.portfolioName}>
                {portfolio.name}
                {isSelected && <span className={styles.selectedBadge}>Selected</span>}
                {portfolio.is_default && <span className={styles.defaultBadge}>(Default)</span>}
              </div>
              <div className={styles.portfolioValue}>{formatCurrency(portfolio.totalValue)}</div>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={(event) => {
                event.stopPropagation()
                onStartRenaming(portfolio)
              }}
              title="Rename portfolio"
            >
              <Pencil size={16} />
            </button>
            {!portfolio.is_default && (
              <button
                type="button"
                className={`${styles.actionButton} ${styles.delete}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onStartDeleting(portfolio)
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
  )
}
