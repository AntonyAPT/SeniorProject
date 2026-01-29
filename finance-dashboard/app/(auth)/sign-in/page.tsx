import { Logo } from '../components'
import { SignInButton } from './SignInButton'

export default function SignInPage() {
  return (
    <>
      <Logo />
      <h1 className="text-2xl font-bold text-white mb-6">Welcome to Stonks</h1>
      <SignInButton />
      <p className="text-zinc-400 text-sm mt-4">
        Sign in with your Google account to get started
      </p>
    </>
  )
}