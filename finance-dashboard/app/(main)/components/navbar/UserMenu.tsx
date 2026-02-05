'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useNavigation, NavigationTarget } from '../../hooks'
import styles from './navbar.module.css'

type UserMenuProps = {
  avatarUrl: string | null
  username: string
}

type MenuItem = {
  id: NavigationTarget
  label: string
}

const menuItems: MenuItem[] = [
  { id: 'portfolios', label: 'View Portfolios' },
  { id: 'settings', label: 'Profile Settings' },
  { id: 'theme', label: 'Toggle Dark Mode' },
]

export function UserMenu({ avatarUrl, username }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { navigate } = useNavigation()

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuClick = (id: NavigationTarget) => {
    navigate(id)
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        className={styles.avatarButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={username}
            width={36}
            height={36}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {username[0]?.toUpperCase() || '?'}
          </div>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.username}>{username}</span>
          </div>
          <div className={styles.dropdownDivider} />

          {menuItems.map((item) => (
            <button
              key={item.id}
              className={styles.dropdownItem}
              onClick={() => handleMenuClick(item.id)}
            >
              {item.label}
            </button>
          ))}

          <div className={styles.dropdownDivider} />

          <button
            className={styles.signOutItem}
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}