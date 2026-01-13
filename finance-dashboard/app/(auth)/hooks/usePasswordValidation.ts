export function usePasswordValidation(password: string) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  const strengthChecks = [hasMinLength, hasUppercase, hasLowercase, hasNumber]
  const passedChecks = strengthChecks.filter(Boolean).length
  
  const strength: 'weak' | 'medium' | 'strong' = 
    passedChecks <= 1 ? 'weak' : 
    passedChecks <= 3 ? 'medium' : 
    'strong'

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    passedChecks,
    strength,
    isValid: passedChecks === 4,
  }
}
