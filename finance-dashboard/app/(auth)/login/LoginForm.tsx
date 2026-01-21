"use client"

import { useState } from 'react'
import { FormInput, SubmitButton } from '../components'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Get form data
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('Submitting:', { email, password })

    // Later: actual Supabase auth here
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsLoading(false)
  }

  return (
    <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
      <FormInput
        label="Email"
        type="email"
        name="email"
        required
      />
      <FormInput
        label="Password"
        type="password"
        name="password"
        required
      />
      <SubmitButton
        isLoading={isLoading}
        loadingText="LOGGING IN..."
        text="LOGIN"
      />
    </form>
  )
}
