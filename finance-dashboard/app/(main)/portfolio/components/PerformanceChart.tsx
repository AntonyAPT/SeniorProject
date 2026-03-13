'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { getPortfolioPerformance } from '@/app/(main)/actions/portfolio'
import type { PerformanceRange, PerformancePoint } from '@/app/(main)/actions/portfolio'
import styles from './performanceChart.module.css'

const RANGES: PerformanceRange[] = ['1W', '1M', '3M', '6M', '1Y']

type Props = {
  portfolioId: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string, range: PerformanceRange): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  if (range === '1W') {
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  }
  if (range === '1Y') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/**
 * Custom tooltip rendered inside Recharts' tooltip slot.
 * Kept as a plain component (not a hook) to satisfy recharts' content prop contract.
 */
function ChartTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload as PerformancePoint
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{point.date}</p>
      <p className={styles.tooltipValue}>{formatCurrency(point.value)}</p>
    </div>
  )
}

/**
 * Renders a historical area chart of portfolio equity value.
 *
 * Calls the getPortfolioPerformance server action on mount and whenever the
 * selected time range changes. The gradient color switches from green to red
 * depending on whether the portfolio gained or lost over the selected period.
 *
 * @param portfolioId - ID of the portfolio to chart.
 */
export function PerformanceChart({ portfolioId }: Props) {
  const [range, setRange] = useState<PerformanceRange>('1M')
  const [points, setPoints] = useState<PerformancePoint[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (selectedRange: PerformanceRange) => {
    setLoading(true)
    setError(null)
    const result = await getPortfolioPerformance(portfolioId, selectedRange)
    if (result.error) {
      setError(result.error)
      setPoints(null)
    } else {
      setPoints(result.data)
    }
    setLoading(false)
  }, [portfolioId])

  useEffect(() => {
    fetchData(range)
  }, [range, fetchData])

  // ----- Derived State -----

  // Require at least 1 point; Finnhub candle only has closed-day bars so brand-new
  // portfolios may only have data from yesterday's close, not today's intraday prices.
  const hasData = points && points.length > 0
  const firstValue = hasData ? points[0].value : 0
  const lastValue = hasData ? points[points.length - 1].value : 0
  const isPositive = lastValue >= firstValue
  const absoluteChange = lastValue - firstValue
  const pctChange = firstValue > 0 ? (absoluteChange / firstValue) * 100 : 0

  // Gradient color: green for gains, red for losses
  const gradientColor = isPositive ? '#34d399' : '#f87171'

  // Sparse x-axis ticks to avoid label crowding.
  // Guard against divide-by-zero when there is only a single data point.
  const xTicks = hasData
    ? (() => {
        if (points.length === 1) return [points[0].date]
        const count = Math.min(points.length, range === '1W' ? 7 : 6)
        const step = Math.max(1, Math.floor(points.length / (count - 1)))
        const ticks: string[] = []
        for (let i = 0; i < points.length; i += step) {
          ticks.push(points[i].date)
        }
        if (ticks[ticks.length - 1] !== points[points.length - 1].date) {
          ticks.push(points[points.length - 1].date)
        }
        return ticks
      })()
    : []

  // ----- Render Helpers -----

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.skeleton} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>
          <p className={styles.emptyText}>{error}</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.rangeBar}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`${styles.rangeButton} ${range === r ? styles.rangeButtonActive : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            No performance data available for this period.
          </p>
          <p className={styles.emptyText}>
            Add holdings and check back once markets have closed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Summary header */}
      <div className={styles.summary}>
        <span className={styles.summaryValue}>{formatCurrency(lastValue)}</span>
        <span
          className={`${styles.summaryChange} ${isPositive ? styles.summaryChangePositive : styles.summaryChangeNegative}`}
        >
          {isPositive ? '+' : ''}
          {formatCurrency(absoluteChange)} ({isPositive ? '+' : ''}
          {pctChange.toFixed(2)}%)
        </span>
      </div>

      {/* Range selector */}
      <div className={styles.rangeBar}>
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`${styles.rangeButton} ${range === r ? styles.rangeButtonActive : ''}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart — single-point note shown when candle data only covers one closed trading day */}
      <div className={styles.chartArea}>
        {points.length === 1 && (
          <p className={styles.singlePointNote}>
            Chart will expand as more trading days close.
          </p>
        )}
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={(d) => formatDate(d, range)}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tickFormatter={(v) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(v as number)
              }
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
              dx={-4}
            />
            <Tooltip
              content={ChartTooltip}
              cursor={{ stroke: '#334155', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={gradientColor}
              strokeWidth={2}
              fill="url(#perfGradient)"
              // Show visible dot when there's only one data point; otherwise dots clutter the line
              dot={points.length === 1 ? { r: 5, fill: gradientColor, strokeWidth: 0 } : false}
              activeDot={{ r: 4, fill: gradientColor, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
