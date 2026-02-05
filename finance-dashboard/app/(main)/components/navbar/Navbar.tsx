import { createClient } from '@/lib/supabase/server'
import { NavLinks } from './NavLinks'
import { UserMenu } from './UserMenu'
import styles from './navbar.module.css'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile with avatar_url
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user?.id)
    .single()

  const displayName = profile?.username || user?.user_metadata?.full_name || user?.email || 'User'
  const avatarUrl = profile?.avatar_url || null

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>[ STONKS ]</div>
      <NavLinks />
      <UserMenu avatarUrl={avatarUrl} username={displayName} />
    </nav>
  )
}