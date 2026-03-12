'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import styles from './transactionLedger.module.css'
import { QuickTradeModal } from './QuickTradeModal'

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
  portfolioId: string
}

type ActiveModal = {
  ticker: string
  mode: 'buy' | 'sell'
  maxShares: number
}

// pure utility function (pure = input to output without side effects or component state dependencies)
function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// pure utility function (pure = input to output without side effects or component state dependencies)
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function TransactionLedger({ tickerGroups, portfolioId }: Props) {
  // O(1) lookup, add, delete operations
  const [expandedTickers, setExpandedTickers] = useState<Set<string>>(new Set())
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null)
  const router = useRouter()

  const toggleTicker = (ticker: string) => {
    setExpandedTickers((prev) => {
      const next = new Set(prev)
      if (next.has(ticker)) {
        next.delete(ticker)
      } else {
        next.add(ticker)
      }
      return next
    })
  }

  const openModal = (ticker: string, mode: 'buy' | 'sell', maxShares: number, e: React.MouseEvent) => {
    // Prevent the row click (expand/collapse) from firing
    e.stopPropagation()
    setActiveModal({ ticker, mode, maxShares })
  }

  const handleModalComplete = () => {
    setActiveModal(null)
    // Re-fetch the server component so the updated holdings reflect immediately
    router.refresh()
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
          <span className={styles.colActions} />
          <span className={styles.colCaret} />
        </div>

        {tickerGroups.map((group) => {
          const isExpanded = expandedTickers.has(group.ticker)
          const avgPrice = group.totalShares > 0 ? group.totalInvested / group.totalShares : 0

          return (
            <div key={group.ticker} className={styles.tickerBlock}>
              {/* Primary row — clicking the row toggles expand; Buy/Sell buttons stop propagation */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleTicker(group.ticker)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleTicker(group.ticker)}
                className={styles.primaryRow}
                aria-expanded={isExpanded}
              >
                <span className={styles.colTicker}>
                  <span className={styles.tickerLabel}>{group.ticker}</span>
                </span>
                <span className={styles.colNum}>{group.totalShares.toLocaleString()}</span>
                <span className={styles.colNum}>{formatCurrency(avgPrice)}</span>
                <span className={styles.colNum}>{formatCurrency(group.totalInvested)}</span>

                {/* Quick-action buttons — visible only on row hover via CSS */}
                <span className={styles.colActions}>
                  <span className={styles.quickActions}>
                    <button
                      type="button"
                      aria-label={`Buy more ${group.ticker}`}
                      onClick={(e) => openModal(group.ticker, 'buy', group.totalShares, e)}
                      className={`${styles.quickBtn} ${styles.quickBtnBuy}`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      aria-label={`Sell ${group.ticker}`}
                      onClick={(e) => openModal(group.ticker, 'sell', group.totalShares, e)}
                      className={`${styles.quickBtn} ${styles.quickBtnSell}`}
                    >
                      S
                    </button>
                  </span>
                </span>

                <span className={styles.colCaret}>
                  <ChevronDown
                    className={`${styles.caretIcon} ${isExpanded ? styles.caretOpen : ''}`}
                    size={16}
                  />
                </span>
              </div>

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

      {activeModal && (
        <QuickTradeModal
          ticker={activeModal.ticker}
          mode={activeModal.mode}
          maxShares={activeModal.maxShares}
          portfolioId={portfolioId}
          onClose={() => setActiveModal(null)}
          onComplete={handleModalComplete}
        />
      )}
    </section>
  )
}
