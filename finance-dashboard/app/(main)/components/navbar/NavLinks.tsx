'use client'

import { useState } from 'react'
import { LayoutDashboard, Briefcase, Eye } from 'lucide-react'
import { useNavigation, NavigationTarget, useSelectedPortfolio } from '../../hooks'
import { getDefaultPortfolio, getPortfolioById } from '../../actions/portfolio'
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
  const { selectedPortfolioId, setSelectedPortfolioId } = useSelectedPortfolio()

  const handleNavigation = async (target: NavigationTarget) => {
    // Navigate to user-selected portfolio when available
    if (target === 'portfolio') {
      if (selectedPortfolioId) {
        const selectedResult = await getPortfolioById(selectedPortfolioId)

        if (selectedResult.data?.id) {
          navigate('portfolio', { id: selectedResult.data.id })
          return
        }
      }

      const defaultResult = await getDefaultPortfolio()

      if (defaultResult.data?.id) {
        setSelectedPortfolioId(defaultResult.data.id)
        navigate('portfolio', { id: defaultResult.data.id })
      } else {
        // If no portfolio can be resolved, redirect to portfolios page
        setSelectedPortfolioId(null)
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