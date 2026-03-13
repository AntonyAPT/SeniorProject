'use client'

import styles from './portfolioTransactionLedger.module.css'

export type PortfolioTransaction = {
  id: string
  ticker: string
  action: 'buy' | 'sell'
  quantity: number
  unitPrice: number
  totalAmount: number
  date: string
}

type Props = {
  transactions: PortfolioTransaction[]
  embedded?: boolean
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PortfolioTransactionLedger({ transactions, embedded = false }: Props) {
  const content = transactions.length === 0 ? (
    <p className={styles.emptyState}>No transactions yet.</p>
  ) : (
    <div className={styles.tableWrapper}>
      <div className={styles.headerRow}>
        <span className={styles.colTicker}>Ticker</span>
        <span className={styles.colAction}>Action</span>
        <span className={styles.colNum}>Shares</span>
        <span className={styles.colNum}>Unit Price</span>
        <span className={styles.colNum}>Total Amount</span>
        <span className={styles.colDate}>Date</span>
      </div>

      {transactions.map((transaction) => {
        const actionClass =
          transaction.action === 'buy' ? styles.actionBuy : styles.actionSell

        return (
          <div key={transaction.id} className={styles.row}>
            <span className={styles.colTicker}>{transaction.ticker}</span>
            <span className={`${styles.colAction} ${actionClass}`}>
              {transaction.action.toUpperCase()}
            </span>
            <span className={styles.colNum}>{transaction.quantity.toLocaleString()}</span>
            <span className={styles.colNum}>{formatCurrency(transaction.unitPrice)}</span>
            <span className={styles.colNum}>{formatCurrency(transaction.totalAmount)}</span>
            <span className={styles.colDate}>{formatDate(transaction.date)}</span>
          </div>
        )
      })}
    </div>
  )

  if (embedded) {
    return <div className={styles.embedded}>{content}</div>
  }

  return (
    <section className={styles.container}>
      <h2 className={styles.sectionTitle}>Transactions</h2>
      {content}
    </section>
  )
}
