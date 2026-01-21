"use client"

import styles from './auth.module.css'

interface FormInputProps {
  label: string
  type: 'email' | 'password' | 'text'
  name: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  hasError?: boolean
  isValid?: boolean
  errorMessage?: string
}

export function FormInput({
  label,
  type,
  name,
  value,
  onChange,
  required,
  hasError,
  isValid,
  errorMessage,
}: FormInputProps) {
  const inputClassName = [
    styles.input,
    hasError ? styles.inputError : '',
    isValid ? styles.inputValid : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <label className="text-zinc-400 text-sm min-w-[70px]">{label}:</label>
        <input
          type={type}
          className={inputClassName}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
      {hasError && errorMessage && (
        <p className="text-red-400 text-xs ml-[82px]">{errorMessage}</p>
      )}
    </div>
  )
}
