'use client'

import { useNavigation } from '../hooks'

export function AddStockButton() {
  const { navigate } = useNavigation()

  return (
    <button
      onClick={() => navigate('stock-search')}
      className="w-full py-4 border-2 border-dashed border-border text-muted hover:text-foreground hover:border-muted transition-colors rounded-lg"
    >
      + Add Stock
    </button>
  )
}