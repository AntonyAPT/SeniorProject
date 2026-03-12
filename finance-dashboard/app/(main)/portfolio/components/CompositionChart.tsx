'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { TickerGroup } from './TransactionLedger'
import styles from './compositionChart.module.css'

// Visually distinct palette for dark backgrounds; cycles if more than 10 holdings
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

type Props = {
  tickerGroups: TickerGroup[]
}

type ChartEntry = {
  ticker: string
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
 * Renders a donut chart visualizing the composition of a portfolio by investment value.
 *
 * Each slice represents a held ticker, sized by totalInvested.
 * The center label defaults to total portfolio value + asset count.
 * On hover the center transitions to show the hovered ticker's name, value,
 * portfolio percentage, and share count — no floating tooltip needed.
 *
 * @param tickerGroups - Active holdings (tickers with totalShares > 0) for the portfolio.
 */
export function CompositionChart({ tickerGroups }: Props) {
  const [activeSlice, setActiveSlice] = useState<ActiveSlice | null>(null)

  const data: ChartEntry[] = tickerGroups.map((g) => ({
    ticker: g.ticker,
    value: g.totalInvested,
    shares: g.totalShares,
  }))

  const totalValue = data.reduce((sum, d) => sum + d.value, 0)
  const assetCount = data.length

  const displayed = activeSlice ? activeSlice.entry : null
  const { whole, cents } = formatCurrency(displayed ? displayed.value : totalValue)

  if (assetCount === 0) {
    return <p className={styles.empty}>No holdings to display.</p>
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartArea}>
        {/* Center label swaps between portfolio totals and hovered-slice detail */}
        {/* key forces remount so the fade-in re-triggers on every slice change */}
        <div
          key={activeSlice?.entry.ticker ?? '__total__'}
          className={styles.centerLabel}
        >
          {activeSlice && (
            <span className={styles.centerTicker} style={{ color: activeSlice.color }}>
              {activeSlice.entry.ticker}
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
            <span className={styles.centerAssets}>
              {assetCount} {assetCount === 1 ? 'Asset' : 'Assets'}
            </span>
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
                  entry: { ticker: sectorData.ticker, value: sectorData.value, shares: sectorData.shares },
                  color: SLICE_COLORS[idx % SLICE_COLORS.length],
                  pct: totalValue > 0 ? (sectorData.value / totalValue) * 100 : 0,
                })
              }}
              onMouseLeave={() => setActiveSlice(null)}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.ticker}
                  fill={SLICE_COLORS[idx % SLICE_COLORS.length]}
                  opacity={activeSlice && activeSlice.entry.ticker !== entry.ticker ? 0.45 : 1}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
