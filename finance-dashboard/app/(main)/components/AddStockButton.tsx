'use client'

import { useState } from 'react'
import { SearchModal } from '@/components/stock-search'

export function AddStockButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border-2 border-dashed border-border text-muted hover:text-foreground hover:border-muted transition-colors rounded-lg"
      >
        + Add Stock
      </button>

      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  )
}
