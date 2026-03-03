'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
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
    </div>,
    document.body
  )
}
