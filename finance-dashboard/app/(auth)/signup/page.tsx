"use client"

import { useState } from 'react'
import Link from 'next/link'
import styles from './signup.module.css'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Email validation
  const isValidEmail = email.includes('@') && email.includes('.')
  const showEmailError = email.length > 0 && !isValidEmail

  // Password validation
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  // Password strength
  const strengthChecks = [hasMinLength, hasUppercase, hasLowercase, hasNumber]
  const passedChecks = strengthChecks.filter(Boolean).length
  const passwordStrength = passedChecks <= 1 ? 'weak' : passedChecks <= 3 ? 'medium' : 'strong'

  // Confirm password
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const showConfirmError = confirmPassword.length > 0 && !passwordsMatch

  // Can submit
  const canSubmit = isValidEmail && passedChecks === 4 && passwordsMatch && !isLoading

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
    <div className="flex flex-col items-center gap-8">
      
      {/* CSS Module: branded logo style */}
      <div className={styles.logo}>[ STONKS ]</div>
      
      {/* CSS Module: unique card design */}
      <div className={styles.card}>
        {/* Tailwind: simple text styling */}
        <h1 className="text-lg font-medium text-zinc-200">Create Account</h1>
        
        {/* Tailwind: form layout */}
        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          
          {/* Email */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <label className="text-zinc-400 text-sm min-w-[70px]">Email:</label>
              {/* CSS Module: custom input styling with validation states */}
              <input 
                type="email" 
                className={`${styles.input} ${showEmailError ? styles.inputError : ''} ${isValidEmail ? styles.inputValid : ''}`}
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {showEmailError && (
              <p className="text-red-400 text-xs ml-[82px]">Please enter a valid email</p>
            )}
          </div>
          
          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <label className="text-zinc-400 text-sm min-w-[70px]">Password:</label>
              <input 
                type="password" 
                className={styles.input}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="ml-[82px]">
                {/* Strength bar */}
                <div className={styles.strengthBar}>
                  <div className={`${styles.strengthFill} ${
                    passwordStrength === 'weak' ? styles.strengthWeak :
                    passwordStrength === 'medium' ? styles.strengthMedium :
                    styles.strengthStrong
                  }`} />
                </div>
                <p className={`text-xs mt-1 ${
                  passwordStrength === 'weak' ? 'text-red-400' :
                  passwordStrength === 'medium' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  Password strength: {passwordStrength}
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
            )}
          </div>
          
          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <label className="text-zinc-400 text-sm min-w-[70px]">Confirm:</label>
              <input 
                type="password" 
                className={`${styles.input} ${showConfirmError ? styles.inputError : ''} ${passwordsMatch ? styles.inputValid : ''}`}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {showConfirmError && (
              <p className="text-red-400 text-xs ml-[82px]">Passwords do not match</p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          
          {/* CSS Module: branded button */}
          <button 
            type="submit" 
            className={styles.button}
            disabled={!canSubmit}
          >
            {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
          </button>
        </form>
        
        {/* Tailwind: simple link layout */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-zinc-400 text-sm">
            Already have an account? <Link href="/login" className={styles.link}>Login</Link>
          </span>
        </div>
      </div>
    </div>
  )
}
