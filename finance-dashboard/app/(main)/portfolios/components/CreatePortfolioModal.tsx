import styles from '../portfolios.module.css'

type CreatePortfolioModalProps = {
  createName: string
  isSubmitting: boolean
  onCreateNameChange: (value: string) => void
  onCreate: () => void
  onClose: () => void
}

export function CreatePortfolioModal({
  createName,
  isSubmitting,
  onCreateNameChange,
  onCreate,
  onClose,
}: CreatePortfolioModalProps) {
  return (
    <div className={styles.createFormOverlay} onClick={onClose}>
      <div className={styles.createFormCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.createFormTitle}>Create New Portfolio</h2>
        <input
          type="text"
          value={createName}
          onChange={(e) => onCreateNameChange(e.target.value)}
          className={styles.createFormInput}
          placeholder="Portfolio name"
          autoFocus
          disabled={isSubmitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onCreate()
            }
          }}
        />
        <div className={styles.createFormActions}>
          <button className={styles.createFormSubmit} onClick={onCreate} disabled={isSubmitting || !createName.trim()}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
          <button className={styles.createFormCancel} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
