'use client'

import { useState } from 'react'
import { LayoutDashboard, Briefcase, Eye } from 'lucide-react'
import { useNavigation, NavigationTarget } from '../../hooks'
import { getDefaultPortfolio } from '../../actions/portfolio'
import styles from './navbar.module.css'

type NavItem = {
  id: NavigationTarget
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Briefcase size={22} /> },
  { id: 'watchlist', label: 'Watchlist', icon: <Eye size={22} /> },
]

export function NavLinks() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const { navigate } = useNavigation()

  const handleNavigation = async (target: NavigationTarget) => {
    // Special handling for portfolio navigation - fetch default portfolio
    if (target === 'portfolio') {
      const result = await getDefaultPortfolio()
      
      if (result.data?.id) {
        navigate('portfolio', { id: result.data.id })
      } else {
        // If no default portfolio found, redirect to portfolios page
        navigate('portfolios')
      }
    } else {
      navigate(target)
    }
  }

  return (
    <div className={styles.navLinks}>
      {navItems.map((item) => (
        <button
          key={item.id}
          className={styles.navItem}
          onClick={() => handleNavigation(item.id)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {item.icon}
          <span
            className={`${styles.tooltip} ${hoveredItem === item.id ? styles.tooltipVisible : ''}`}
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}