'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './transactionLedger.module.css'

export type TickerGroup = {
  ticker: string
  totalShares: number
  totalInvested: number
  transactions: {
    id: string
    action: 'buy' | 'sell'
    quantity: number
    buyPrice: number
    totalCost: number
    buyDate: string
  }[]
}

type Props = {
  tickerGroups: TickerGroup[]
}

// defined outside the component body so they aren't redeclared on every re-render.
// Since they don't need access to props or state, there's no reason to put them inside.


// pure utility function (pure = input to ouput without side effects or component state dependencies)
function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// pure utility function (pure = input to ouput without side effects or component state dependencies)
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function TransactionLedger({ tickerGroups }: Props) {
  // O(1) lookup, add, delete operations
  const [expandedTickers, setExpandedTickers] = useState<Set<string>>(new Set()) 

  const toggleTicker = (ticker: string) => {
    // prev = whatever expandedTickers currently is
    setExpandedTickers((prev) => {
      // React sees a new reference and triggers a re-render.
      // guarantees that prev is always the most up-to-date value of the state
      // next = fresh copy of prev
      const next = new Set(prev)
      if (next.has(ticker)) {
        next.delete(ticker)
      } else {
        next.add(ticker)
      }
      // React replaces expandedTickers with new next set
      return next 
    })
  }

  if (tickerGroups.length === 0) {
    return (
      <section className={styles.container}>
        <h2 className={styles.sectionTitle}>Holdings</h2>
        <p className={styles.emptyState}>
          No holdings yet. Add stocks from the stock detail page.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.sectionTitle}>Holdings</h2>

      <div className={styles.tableWrapper}>
        {/* Header row */}
        <div className={styles.headerRow}>
          <span className={styles.colTicker}>Ticker</span>
          <span className={styles.colNum}>Total Shares</span>
          <span className={styles.colNum}>Avg Price</span>
          <span className={styles.colNum}>Total Invested</span>
          <span className={styles.colCaret} />
        </div>

        {tickerGroups.map((group) => {
          const isExpanded = expandedTickers.has(group.ticker)
          // unnessary guard clause for checking totalShares > 0
          const avgPrice = group.totalShares > 0 ? group.totalInvested / group.totalShares : 0

          return (
            // React requires a unique key on elements produced inside .map(). 
            // This lets React track which element is which between re-renders 
            <div key={group.ticker} className={styles.tickerBlock}>
              {/* Primary row */}
              {/* This matters for accessibility — screen readers understand buttons are interactive, announce them as clickable, 
              and allow keyboard navigation to them. (Based Claude) */}
              <button
                type="button"
                onClick={() => toggleTicker(group.ticker)}
                className={styles.primaryRow}
                // accessibility attribute that tells screen readers whether the controlled content below 
                // is currently visible or hidden.
                aria-expanded={isExpanded} 
              >
                <span className={styles.colTicker}>
                  <span className={styles.tickerLabel}>{group.ticker}</span>
                </span>
                <span className={styles.colNum}>{group.totalShares.toLocaleString()}</span>
                <span className={styles.colNum}>{formatCurrency(avgPrice)}</span>
                <span className={styles.colNum}>{formatCurrency(group.totalInvested)}</span>
                <span className={styles.colCaret}>
                  <ChevronDown
                    className={`${styles.caretIcon} ${isExpanded ? styles.caretOpen : ''}`}
                    size={16}
                  />
                </span>
              </button>

              {/* Sub-rows */}
              <div
                className={`${styles.subRowsWrapper} ${isExpanded ? styles.subRowsVisible : ''}`}
              >
                <div className={styles.subRowsInner}>
                  {/* Sub-header */}
                  <div className={styles.subHeader}>
                    <span className={styles.subColAction}>Action</span>
                    <span className={styles.subColQty}>Shares</span>
                    <span className={styles.subColPrice}>Unit Price</span>
                    <span className={styles.subColCost}>Total Cost</span>
                    <span className={styles.subColDate}>Date</span>
                  </div>

                  {group.transactions.map((tx) => {
                    const actionStyle = tx.action === 'buy' ? styles.actionBuy : styles.actionSell
                    return (
                      <div key={tx.id} className={styles.subRow}>
                        <span className={`${styles.subColAction} ${actionStyle}`}>
                          {tx.action.toUpperCase()}
                        </span>
                        <span className={styles.subColQty}>{tx.quantity.toLocaleString()}</span>
                        <span className={styles.subColPrice}>{formatCurrency(tx.buyPrice)}</span>
                        <span className={`${styles.subColCost} ${actionStyle}`}>
                          {formatCurrency(tx.totalCost)}
                        </span>
                        <span className={styles.subColDate}>{formatDate(tx.buyDate)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
