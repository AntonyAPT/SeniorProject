'use client'

import { useCallback, useEffect, useState } from 'react'

const SELECTED_PORTFOLIO_STORAGE_KEY = 'stonks:selectedPortfolioId'

export function useSelectedPortfolio() {
  const [selectedPortfolioId, setSelectedPortfolioIdState] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedPortfolioId = window.localStorage.getItem(SELECTED_PORTFOLIO_STORAGE_KEY)
    setSelectedPortfolioIdState(storedPortfolioId)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SELECTED_PORTFOLIO_STORAGE_KEY) {
        setSelectedPortfolioIdState(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setSelectedPortfolioId = useCallback((portfolioId: string | null) => {
    setSelectedPortfolioIdState(portfolioId)

    if (portfolioId) {
      window.localStorage.setItem(SELECTED_PORTFOLIO_STORAGE_KEY, portfolioId)
      return
    }

    window.localStorage.removeItem(SELECTED_PORTFOLIO_STORAGE_KEY)
  }, [])

  return {
    selectedPortfolioId,
    isHydrated,
    setSelectedPortfolioId,
  }
}
