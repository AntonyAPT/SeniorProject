"use client"

import styles from './auth.module.css'

interface PasswordValidation {
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  strength: 'weak' | 'medium' | 'strong'
}

interface PasswordStrengthIndicatorProps {
  validation: PasswordValidation
  show: boolean
}

export function PasswordStrengthIndicator({ validation, show }: PasswordStrengthIndicatorProps) {
  if (!show) return null

  const { hasMinLength, hasUppercase, hasLowercase, hasNumber, strength } = validation

  const strengthFillClass = [
    styles.strengthFill,
    strength === 'weak' ? styles.strengthWeak :
    strength === 'medium' ? styles.strengthMedium :
    styles.strengthStrong
  ].join(' ')

  const strengthTextColor = 
    strength === 'weak' ? 'text-red-400' :
    strength === 'medium' ? 'text-yellow-400' :
    'text-green-400'

  return (
    <div className="ml-[82px]">
      {/* Strength bar */}
      <div className={styles.strengthBar}>
        <div className={strengthFillClass} />
      </div>
      <p className={`text-xs mt-1 ${strengthTextColor}`}>
        Password strength: {strength}
      </p>

      {/* Requirements checklist */}
      <ul className="text-xs mt-2 space-y-1">
        <li className={hasMinLength ? 'text-green-400' : 'text-zinc-500'}>
          {hasMinLength ? '✓' : '○'} At least 8 characters
        </li>
        <li className={hasUppercase ? 'text-green-400' : 'text-zinc-500'}>
          {hasUppercase ? '✓' : '○'} One uppercase letter
        </li>
        <li className={hasLowercase ? 'text-green-400' : 'text-zinc-500'}>
          {hasLowercase ? '✓' : '○'} One lowercase letter
        </li>
        <li className={hasNumber ? 'text-green-400' : 'text-zinc-500'}>
          {hasNumber ? '✓' : '○'} One number
        </li>
      </ul>
    </div>
  )
}
