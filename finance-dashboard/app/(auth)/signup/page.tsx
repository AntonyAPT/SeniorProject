import Link from 'next/link'
import { Logo, AuthCard } from '../components'
import { SignupForm } from './SignupForm'
import styles from '../components/auth.module.css'

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <Logo />
      <AuthCard>
        <h1 className="text-lg font-medium text-zinc-200">Create Account</h1>
        <SignupForm />
        <div className="flex flex-col items-center gap-2">
          <span className="text-zinc-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>Login</Link>
          </span>
        </div>
      </AuthCard>
    </div>
  )
}
