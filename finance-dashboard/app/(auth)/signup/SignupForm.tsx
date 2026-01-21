"use client"

import { useState } from 'react'
import { FormInput, SubmitButton, PasswordStrengthIndicator } from '../components'
import { usePasswordValidation, useEmailValidation } from '../hooks'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Validation hooks
  const emailValidation = useEmailValidation(email)
  const passwordValidation = usePasswordValidation(password)

  // Confirm password
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const showConfirmError = confirmPassword.length > 0 && !passwordsMatch

  // Can submit
  const canSubmit = emailValidation.isValid && passwordValidation.isValid && passwordsMatch && !isLoading

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('Signing up:', { email, password })

    // Later: actual Supabase auth here
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsLoading(false)
    // setError('Email already in use') // Uncomment to test error display
  }

  return (
    <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
      {/* Email */}
      <FormInput
        label="Email"
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        hasError={emailValidation.showError}
        isValid={emailValidation.isValid}
        errorMessage="Please enter a valid email"
      />

      {/* Password */}
      <div className="flex flex-col gap-1">
        <FormInput
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthIndicator
          validation={passwordValidation}
          show={password.length > 0}
        />
      </div>

      {/* Confirm Password */}
      <FormInput
        label="Confirm"
        type="password"
        name="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        hasError={showConfirmError}
        isValid={passwordsMatch}
        errorMessage="Passwords do not match"
      />

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {/* Submit button */}
      <SubmitButton
        isLoading={isLoading}
        disabled={!canSubmit}
        loadingText="CREATING ACCOUNT..."
        text="SIGN UP"
      />
    </form>
  )
}
