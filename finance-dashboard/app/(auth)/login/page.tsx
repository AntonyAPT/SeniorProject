import Link from 'next/link'
import { Logo, AuthCard } from '../components'
import { LoginForm } from './LoginForm'
import styles from '../components/auth.module.css'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <Logo />
      <AuthCard>
        <h1 className="text-lg font-medium text-zinc-200">Welcome Back</h1>
        <LoginForm />
        <div className="flex flex-col items-center gap-2">
          <Link href="/forgot-password" className={styles.linkMuted}>
            Forgot Password?
          </Link>
          <span className="text-zinc-400 text-sm">
            New?{' '}
            <Link href="/signup" className={styles.link}>[Sign Up Here]</Link>
          </span>
        </div>
      </AuthCard>
    </div>
  )
}
