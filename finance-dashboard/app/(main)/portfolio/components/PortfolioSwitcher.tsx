'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useSelectedPortfolio } from '../../contexts/SelectedPortfolioContext'
import styles from './portfolioSwitcher.module.css'

type Portfolio = {
  id: string
  name: string
}

type PortfolioSwitcherProps = {
  portfolios: Portfolio[]
  currentPortfolioId: string
}

/**
 * Inline dropdown that lets the user switch between their portfolios or navigate
 * to the Manage Portfolios page. Replaces the static portfolio name heading so
 * the header stays compact while gaining switchability.
 *
 * Receives the full portfolio list from the server component to avoid a
 * client-side fetch on every render.
 */
export function PortfolioSwitcher({ portfolios, currentPortfolioId }: PortfolioSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false) // control dropdown visibility
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { setSelectedPortfolioId } = useSelectedPortfolio() // context writer (persisting selection to localstorage)

  const currentPortfolio = portfolios.find((p) => p.id === currentPortfolioId)

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPortfolio = (portfolio: Portfolio) => {
    setIsOpen(false)
    if (portfolio.id === currentPortfolioId) return
    setSelectedPortfolioId(portfolio.id, portfolio.name)
    router.push(`/portfolio/${portfolio.id}`)
  }

  const handleManagePortfolios = () => {
    setIsOpen(false)
    router.push('/portfolios')
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.triggerName}>
          {currentPortfolio?.name ?? 'Portfolio'}
        </span>
        <ChevronDown
          size={20}
          className={`${styles.triggerCaret} ${isOpen ? styles.triggerCaretOpen : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {portfolios.map((portfolio) => (
            <button
              key={portfolio.id}
              role="option"
              aria-selected={portfolio.id === currentPortfolioId}
              className={`${styles.option} ${portfolio.id === currentPortfolioId ? styles.optionActive : ''}`}
              onClick={() => handleSelectPortfolio(portfolio)}
            >
              {portfolio.name}
            </button>
          ))}

          <div className={styles.divider} />

          <button className={styles.manageOption} onClick={handleManagePortfolios}>
            Manage Portfolios
          </button>
        </div>
      )}
    </div>
  )
}
