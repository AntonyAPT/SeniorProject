
export type PortfolioWithValue = {
  id: string
  name: string
  is_default: boolean
  created_at: string
  totalValue: number
}

export type SetPortfolioIdFn = (portfolioId: string | null) => void
