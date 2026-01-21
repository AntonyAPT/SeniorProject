"use client"

import styles from './auth.module.css'

interface SubmitButtonProps {
  isLoading: boolean
  disabled?: boolean
  loadingText: string
  text: string
}

export function SubmitButton({ isLoading, disabled, loadingText, text }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={styles.button}
      disabled={disabled || isLoading}
    >
      {isLoading ? loadingText : text}
    </button>
  )
}
