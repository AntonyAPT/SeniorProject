import styles from './auth.module.css'

interface AuthCardProps {
  children: React.ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return <div className={styles.card}>{children}</div>
}
