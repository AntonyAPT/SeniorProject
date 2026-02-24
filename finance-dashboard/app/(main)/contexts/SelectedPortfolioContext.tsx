'use client'

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react'
import type { SetPortfolioIdFn } from '../portfolios/types'

const SELECTED_PORTFOLIO_STORAGE_KEY = 'stonks:selectedPortfolioId'

type SelectedPortfolioContextValue = {
  selectedPortfolioId: string | null
  isHydrated: boolean
  setSelectedPortfolioId: SetPortfolioIdFn
}

// creating the portal that allows any component to access data/states
const SelectedPortfolioContext = createContext<SelectedPortfolioContextValue | null>(null)

type SelectedPortfolioProviderProps = {
  children: ReactNode
}

// supplying the data
export function SelectedPortfolioProvider({ children }: SelectedPortfolioProviderProps) {
  const [selectedPortfolioId, setSelectedPortfolioIdState] = useState<string | null>(null)
  // safety flag that confirms when a localStorage read is complete
  // prevents bugs where a component acts on null before the stored value has been loaded to selectedPortfolioId
  const [isHydrated, setIsHydrated] = useState(false)   

  useEffect(() => {
    const storedPortfolioId = window.localStorage.getItem(SELECTED_PORTFOLIO_STORAGE_KEY)
    setSelectedPortfolioIdState(storedPortfolioId)
    setIsHydrated(true)
  }, [])

  // update in-memory state and syncs to localStorage
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

// context wrapper with better naming convention
export function useSelectedPortfolio() {
  const context = useContext(SelectedPortfolioContext)

  if (!context) {
    throw new Error('useSelectedPortfolio must be used within SelectedPortfolioProvider')
  }

  return context
}
