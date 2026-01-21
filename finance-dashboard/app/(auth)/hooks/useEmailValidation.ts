export function useEmailValidation(email: string) {
  const isValid = email.includes('@') && email.includes('.')
  const showError = email.length > 0 && !isValid

  return { isValid, showError }
}
