import styles from './components/auth.module.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className={styles.card}>
        {children}
      </div>
    </div>
  )
}