import styles from '../portfolios.module.css'

type DeleteConfirmModalProps = {
  portfolioName: string
  isSubmitting: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeleteConfirmModal({ portfolioName, isSubmitting, onConfirm, onClose }: DeleteConfirmModalProps) {
  return (
    <div className={styles.deleteConfirmOverlay} onClick={onClose}>
      <div className={styles.deleteConfirmCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.deleteConfirmTitle}>Delete Portfolio</h2>
        <p className={styles.deleteConfirmText}>
          Are you sure you want to delete "{portfolioName}"? This will also delete all stocks in this portfolio. This
          action cannot be undone.
        </p>
        <div className={styles.deleteConfirmActions}>
          <button className={styles.deleteConfirmButton} onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
          <button className={styles.deleteCancelButton} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
