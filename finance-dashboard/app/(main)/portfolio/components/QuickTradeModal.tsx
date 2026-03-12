'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { TradingViewWidget } from '@/components/tradingview/TradingViewWidget'
import { miniChartConfig } from '@/components/tradingview/widget-configs'
import { addStockToPortfolio, sellStockFromPortfolio } from '@/app/(main)/actions/portfolio'
import styles from './quickTradeModal.module.css'

interface QuickTradeModalProps {
  ticker: string
  mode: 'buy' | 'sell'
  /** Current net share count — caps sell quantity */
  maxShares: number
  portfolioId: string
  onClose: () => void
  onComplete: () => void
}

const MIN_QUANTITY = 1
const MAX_BUY_QUANTITY = 99999

/**
 * Modal for buying or selling a stock directly from the portfolio holdings table.
 * Renders a MiniChart for quick price context plus a quantity picker and action button.
 */
export function QuickTradeModal({
  ticker,
  mode,
  maxShares,
  portfolioId,
  onClose,
  onComplete,
}: QuickTradeModalProps) {
  const maxQuantity = mode === 'sell' ? maxShares : MAX_BUY_QUANTITY

  const [quantity, setQuantity] = useState<number>(MIN_QUANTITY)
  const [quantityInput, setQuantityInput] = useState<string>(String(MIN_QUANTITY))
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const syncQuantity = (value: number) => {
    const clamped = Math.min(maxQuantity, Math.max(MIN_QUANTITY, value))
    setQuantity(clamped)
    setQuantityInput(String(clamped))
  }

  const commitInput = () => {
    if (quantityInput.trim() === '') {
      syncQuantity(MIN_QUANTITY)
      return
    }
    const parsed = Number.parseInt(quantityInput, 10)
    if (Number.isNaN(parsed)) {
      syncQuantity(MIN_QUANTITY)
      return
    }
    syncQuantity(parsed)
  }

  const handleQuantityChange = (nextValue: string) => {
    if (nextValue === '') {
      setQuantityInput('')
      return
    }
    const digitsOnly = nextValue.replace(/\D/g, '').slice(0, 5)
    if (digitsOnly.length === 0) return
    const parsed = Number.parseInt(digitsOnly, 10)
    if (Number.isNaN(parsed)) return
    const clamped = Math.min(maxQuantity, Math.max(MIN_QUANTITY, parsed))
    setQuantity(clamped)
    setQuantityInput(String(clamped))
  }

  const handleSubmit = async () => {
    commitInput()
    const shares = quantityInput.trim() === '' ? MIN_QUANTITY : quantity

    setIsSubmitting(true)
    try {
      if (mode === 'buy') {
        const result = await addStockToPortfolio(portfolioId, ticker, shares)
        if (result.error) {
          toast.error(result.error)
        } else {
          const price = result.data!.buy_price
          toast.success(
            `Bought ${shares} share${shares === 1 ? '' : 's'} of ${ticker} at $${price.toFixed(2)}`,
            { description: 'Added to portfolio' }
          )
          onComplete()
        }
      } else {
        const result = await sellStockFromPortfolio(portfolioId, ticker, shares)
        if (result.error) {
          toast.error(result.error)
        } else {
          const price = result.data!.buy_price
          toast.success(
            `Sold ${shares} share${shares === 1 ? '' : 's'} of ${ticker} at $${price.toFixed(2)}`,
            { description: 'Removed from portfolio' }
          )
          onComplete()
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!mounted) return null

  const isBuy = mode === 'buy'
  const actionLabel = isBuy ? 'Add to Portfolio' : 'Remove from Portfolio'
  const submittingLabel = isBuy ? 'Buying...' : 'Selling...'

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${isBuy ? 'Buy' : 'Sell'} ${ticker}`}
    >
      <div className={styles.card}>
        {/* ===== Header ===== */}
        <div className={styles.header}>
          <p className={styles.title}>
            <span className={styles.tickerTag}>{ticker}</span>
            {isBuy ? ' — Buy Shares' : ' — Sell Shares'}
          </p>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className={styles.closeBtn}
          >
            <X size={16} />
          </button>
        </div>

        {/* ===== MiniChart ===== */}
        <div className={styles.chartWrapper}>
          <TradingViewWidget
            widget="miniChart"
            config={miniChartConfig(ticker)}
            className="h-full"
            innerClassName="h-full"
          />
        </div>

        {/* ===== Quantity picker ===== */}
        <div>
          <p className={styles.quantityLabel}>
            {isBuy
              ? 'Quantity (1 to 99,999 shares per order)'
              : `Quantity (1 to ${maxShares} share${maxShares === 1 ? '' : 's'} available)`}
          </p>
          <div className={styles.quantityRow}>
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => syncQuantity(quantity - 1)}
              disabled={quantity <= MIN_QUANTITY}
              className={styles.quantityBtn}
            >
              <Minus size={20} />
            </button>

            <input
              value={quantityInput}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={commitInput}
              inputMode="numeric"
              aria-label="Share quantity"
              className={styles.quantityInput}
            />

            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => syncQuantity(quantity + 1)}
              disabled={quantity >= maxQuantity}
              className={styles.quantityBtn}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* ===== Action button ===== */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`${styles.actionBtn} ${isBuy ? styles.actionBtnBuy : styles.actionBtnSell}`}
        >
          {isSubmitting ? submittingLabel : actionLabel}
        </button>
      </div>
    </div>,
    document.body
  )
}
