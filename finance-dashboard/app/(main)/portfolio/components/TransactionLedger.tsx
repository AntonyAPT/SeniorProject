'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import styles from './transactionLedger.module.css'
import { QuickTradeModal } from './QuickTradeModal'
import { PortfolioTransactionLedger } from './PortfolioTransactionLedger'
import type { PortfolioTransaction } from './PortfolioTransactionLedger'

export type TickerGroup = {
  ticker: string
  totalShares: number
  totalInvested: number
  currentPrice: number | null
  currentValue: number | null
  unrealizedGain: number | null
  unrealizedGainPct: number | null
  transactions: {
    id: string
    action: 'buy' | 'sell'
    quantity: number
    remainingQuantity: number
    buyPrice: number
    totalCost: number
    currentValue: number | null
    unrealizedGain: number | null
    unrealizedGainPct: number | null
    buyDate: string
  }[]
}

type Props = {
  tickerGroups: TickerGroup[]
  portfolioId: string
  transactions: PortfolioTransaction[]
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

function formatSignedCurrency(value: number): string {
  if (value === 0) {
    return formatCurrency(0)
  }

  const sign = value > 0 ? '+' : '-'
  return `${sign}${formatCurrency(Math.abs(value))}`
}

// pure utility function (pure = input to output without side effects or component state dependencies)
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatGainLossLabel(value: number, pct: number): string {
  return `${formatSignedCurrency(value)} (${pct > 0 ? '+' : ''}${pct.toFixed(2)}%)`
}

export function TransactionLedger({ tickerGroups, portfolioId, transactions }: Props) {
  // O(1) lookup, add, delete operations
  const [expandedTickers, setExpandedTickers] = useState<Set<string>>(new Set())
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null)
  const [view, setView] = useState<'holdings' | 'transactions'>('holdings')
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
    e.stopPropagation()
    setActiveModal({ ticker, mode, maxShares })
  }

  const handleModalComplete = () => {
    setActiveModal(null)
    router.refresh()
  }

  const isTransactionsView = view === 'transactions'
  const sectionTitle = isTransactionsView ? 'Transactions' : 'Holdings'
  const toggleLabel = isTransactionsView ? 'Holdings' : 'Transactions'

  return (
    <section className={styles.container}>
      <div className={styles.titleRow}>
        <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
        <button
          type="button"
          className={`${styles.transactionsButton} ${isTransactionsView ? styles.transactionsButtonActive : ''}`}
          onClick={() => setView((current) => (current === 'holdings' ? 'transactions' : 'holdings'))}
        >
          {toggleLabel}
        </button>
      </div>

      {isTransactionsView ? (
        <PortfolioTransactionLedger transactions={transactions} embedded />
      ) : tickerGroups.length === 0 ? (
        <p className={styles.emptyState}>
          No holdings yet. Add stocks from the stock detail page.
        </p>
      ) : (
        <div className={styles.tableWrapper}>
        {/* Header row */}
        <div className={styles.headerRow}>
          <span className={styles.colTicker}>Ticker</span>
          <span className={styles.colNum}>Total Shares</span>
          <span className={styles.colNum}>Avg Price</span>
          <span className={styles.colNum}>Total Invested</span>
          <span className={styles.colNum}>Current Value</span>
          <span className={styles.colNum}>Gain/Loss</span>
          <span className={styles.colActions} />
          <span className={styles.colCaret} />
        </div>

        {tickerGroups.map((group) => {
          const isExpanded = expandedTickers.has(group.ticker)
          const avgPrice = group.totalShares > 0 ? group.totalInvested / group.totalShares : 0
          const openTransactions = group.transactions.filter(
            (tx) => tx.action === 'buy' && tx.remainingQuantity > 0
          )
          const gainLossClass =
            group.unrealizedGain === null
              ? styles.gainUnknown
              : group.unrealizedGain > 0
                ? styles.gainPositive
                : group.unrealizedGain < 0
                  ? styles.gainNegative
                  : ''

          return (
            <div key={group.ticker} className={styles.tickerBlock}>
              {/* Primary row — div instead of button to avoid nested-button HTML invalidity.
                  role="button" + tabIndex + onKeyDown preserves full keyboard accessibility. */}
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
                <span className={styles.colNum}>
                  {group.currentValue === null ? 'N/A' : formatCurrency(group.currentValue)}
                </span>
                <span className={`${styles.colNum} ${gainLossClass}`}>
                  {group.unrealizedGain === null || group.unrealizedGainPct === null
                    ? 'N/A'
                    : `${formatSignedCurrency(group.unrealizedGain)} (${group.unrealizedGainPct > 0 ? '+' : ''}${group.unrealizedGainPct.toFixed(2)}%)`}
                </span>

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
                    <span className={styles.subColQty}>Shares</span>
                    <span className={styles.subColPrice}>Unit Price</span>
                    <span className={styles.subColCost}>Total Cost</span>
                    <span className={styles.subColGain}>Gain/Loss</span>
                    <span className={styles.subColDate}>Date</span>
                  </div>

                  {openTransactions.map((tx) => {
                    const subRowGainClass =
                      tx.unrealizedGain === null
                        ? styles.gainUnknown
                        : tx.unrealizedGain > 0
                          ? styles.gainPositive
                          : tx.unrealizedGain < 0
                            ? styles.gainNegative
                            : ''
                    const gainLossText =
                      tx.unrealizedGain === null || tx.unrealizedGainPct === null
                        ? 'N/A'
                        : formatGainLossLabel(tx.unrealizedGain, tx.unrealizedGainPct)
                    const openLotCost = tx.remainingQuantity * tx.buyPrice

                    return (
                      <div key={tx.id} className={styles.subRow}>
                        <span className={styles.subColQty}>{tx.remainingQuantity.toLocaleString()}</span>
                        <span className={styles.subColPrice}>{formatCurrency(tx.buyPrice)}</span>
                        <span className={styles.subColCost}>
                          {formatCurrency(openLotCost)}
                        </span>
                        <span className={`${styles.subColGain} ${subRowGainClass}`}>
                          {gainLossText}
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
      )}

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
