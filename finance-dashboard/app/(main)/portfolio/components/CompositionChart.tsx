'use client'

import { useState, useRef, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { TickerGroup } from './TransactionLedger'
import styles from './compositionChart.module.css'

// Visually distinct palette for dark backgrounds; cycles if more than 10 slices
const SLICE_COLORS = [
  '#F97316',
  '#06B6D4',
  '#8B5CF6',
  '#22C55E',
  '#D1D5DB',
  '#EAB308',
  '#EF4444',
  '#EC4899',
  '#14B8A6',
  '#3B82F6',
]

type ViewMode = 'stocks' | 'industry'

type Props = {
  tickerGroups: TickerGroup[]
  industryMap: Record<string, string>
}

type ChartEntry = {
  label: string
  value: number
  shares: number
}

type ActiveSlice = {
  entry: ChartEntry
  color: string
  pct: number
}

function formatCurrency(amount: number): { whole: string; cents: string } {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
  const dotIdx = formatted.lastIndexOf('.')
  return {
    whole: formatted.slice(0, dotIdx),
    cents: formatted.slice(dotIdx),
  }
}

/**
 * Renders a donut chart visualizing the composition of a portfolio.
 *
 * Supports two view modes toggled by a dropdown in the top-right corner:
 * - Stocks: each slice is a held ticker, sized by totalInvested.
 * - Industry: slices aggregate tickers by industry sector.
 *
 * The center label defaults to total portfolio value + count summary.
 * On hover it transitions to show the hovered slice's name, value,
 * portfolio percentage, and share count.
 *
 * @param tickerGroups - Active holdings (tickers with totalShares > 0) for the portfolio.
 * @param industryMap - Maps each ticker to its industry sector.
 */
export function CompositionChart({ tickerGroups, industryMap }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('stocks')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeSlice, setActiveSlice] = useState<ActiveSlice | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const stockData: ChartEntry[] = tickerGroups.map((g) => ({
    label: g.ticker,
    value: g.totalInvested,
    shares: g.totalShares,
  }))

  const industryData: ChartEntry[] = (() => {
    const map = new Map<string, ChartEntry>()
    for (const g of tickerGroups) {
      const industry = industryMap[g.ticker] ?? 'Other'
      const existing = map.get(industry)
      if (existing) {
        existing.value += g.totalInvested
        existing.shares += g.totalShares
      } else {
        map.set(industry, { label: industry, value: g.totalInvested, shares: g.totalShares })
      }
    }
    return Array.from(map.values())
  })()

  const data = viewMode === 'stocks' ? stockData : industryData
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)
  const sliceCount = data.length

  const displayed = activeSlice ? activeSlice.entry : null
  const { whole, cents } = formatCurrency(displayed ? displayed.value : totalValue)

  const centerCountLabel = viewMode === 'stocks'
    ? `${sliceCount} ${sliceCount === 1 ? 'Asset' : 'Assets'}`
    : `${sliceCount} ${sliceCount === 1 ? 'Industry' : 'Industries'}`

  if (stockData.length === 0) {
    return <p className={styles.empty}>No holdings to display.</p>
  }

  return (
    <div className={styles.wrapper}>
      {/* View-by dropdown filter */}
      <div className={styles.filterBar} ref={dropdownRef}>
        <button
          className={styles.filterButton}
          onClick={() => setDropdownOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          View by: <span className={styles.filterButtonValue}>{viewMode === 'stocks' ? 'Stocks' : 'Industry'}</span>
          <span className={styles.filterCaret} aria-hidden>▾</span>
        </button>
        {dropdownOpen && (
          <div className={styles.filterDropdown} role="listbox">
            {(['stocks', 'industry'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                role="option"
                aria-selected={viewMode === mode}
                className={`${styles.filterOption} ${viewMode === mode ? styles.filterOptionActive : ''}`}
                onClick={() => {
                  setViewMode(mode)
                  setActiveSlice(null)
                  setDropdownOpen(false)
                }}
              >
                {mode === 'stocks' ? 'Stocks' : 'Industry'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.chartArea}>
        {/* Center label swaps between portfolio totals and hovered-slice detail */}
        {/* key forces remount so the fade-in re-triggers on every slice change */}
        <div
          key={activeSlice?.entry.label ?? `__total__${viewMode}`}
          className={styles.centerLabel}
        >
          {activeSlice && (
            <span
              className={`${styles.centerTicker} ${viewMode === 'stocks' ? styles.centerTickerStock : ''}`}
              style={{ color: activeSlice.color }}
            >
              {activeSlice.entry.label}
            </span>
          )}
          <span className={styles.centerValue}>
            {whole}
            <span className={styles.centerCents}>{cents}</span>
          </span>
          {activeSlice ? (
            <div className={styles.centerMeta}>
              <span>{activeSlice.pct.toFixed(1)}% of portfolio</span>
              <span>{activeSlice.entry.shares} {activeSlice.entry.shares === 1 ? 'share' : 'shares'}</span>
            </div>
          ) : (
            <span className={styles.centerAssets}>{centerCountLabel}</span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="82%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
              onMouseEnter={(sectorData: any, idx) => {
                setActiveSlice({
                  entry: { label: sectorData.label, value: sectorData.value, shares: sectorData.shares },
                  color: SLICE_COLORS[idx % SLICE_COLORS.length],
                  pct: totalValue > 0 ? (sectorData.value / totalValue) * 100 : 0,
                })
              }}
              onMouseLeave={() => setActiveSlice(null)}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.label}
                  fill={SLICE_COLORS[idx % SLICE_COLORS.length]}
                  opacity={activeSlice && activeSlice.entry.label !== entry.label ? 0.45 : 1}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
