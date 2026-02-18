'use client'

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react'

const SELECTED_PORTFOLIO_STORAGE_KEY = 'stonks:selectedPortfolioId'

type SelectedPortfolioContextValue = {
  selectedPortfolioId: string | null
  isHydrated: boolean
  setSelectedPortfolioId: (portfolioId: string | null) => void
}

const SelectedPortfolioContext = createContext<SelectedPortfolioContextValue | null>(null)

type SelectedPortfolioProviderProps = {
  children: ReactNode
}

export function SelectedPortfolioProvider({ children }: SelectedPortfolioProviderProps) {
  const [selectedPortfolioId, setSelectedPortfolioIdState] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedPortfolioId = window.localStorage.getItem(SELECTED_PORTFOLIO_STORAGE_KEY)
    setSelectedPortfolioIdState(storedPortfolioId)
    setIsHydrated(true)
  }, [])

  const setSelectedPortfolioId = useCallback((portfolioId: string | null) => {
    setSelectedPortfolioIdState(portfolioId)

    if (portfolioId) {
      window.localStorage.setItem(SELECTED_PORTFOLIO_STORAGE_KEY, portfolioId)
      return
    }

    window.localStorage.removeItem(SELECTED_PORTFOLIO_STORAGE_KEY)
  }, [])

  return (
    <SelectedPortfolioContext.Provider
      value={{
        selectedPortfolioId,
        isHydrated,
        setSelectedPortfolioId,
      }}
    >
      {children}
    </SelectedPortfolioContext.Provider>
  )
}

export function useSelectedPortfolio() {
  const context = useContext(SelectedPortfolioContext)

  if (!context) {
    throw new Error('useSelectedPortfolio must be used within SelectedPortfolioProvider')
  }

  return context
}
