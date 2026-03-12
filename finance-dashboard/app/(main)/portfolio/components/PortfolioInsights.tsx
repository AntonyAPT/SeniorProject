'use client'

import { useState } from 'react'
import styles from './portfolioInsights.module.css'
import { CompositionChart } from './CompositionChart'
import { PerformanceChart } from './PerformanceChart'
import type { TickerGroup } from './TransactionLedger'

type TabId = 'performance' | 'composition' | 'daily-summary'

const TABS: { id: TabId; label: string }[] = [
  { id: 'performance',   label: 'Performance'   },
  { id: 'composition',   label: 'Composition'   },
  { id: 'daily-summary', label: 'Daily Summary' },
]

type Props = {
  portfolioId: string
  tickerGroups: TickerGroup[]
  industryMap: Record<string, string>
}

/**
 * Tabbed container for portfolio analytics panels.
 *
 * Tabs are centered and styled to match the dark slate theme.
 * The Performance tab renders a historical equity chart fetched per-render.
 * The Composition tab renders a donut chart of holdings by invested value.
 *
 * @param portfolioId - Portfolio ID passed to the Performance chart action.
 * @param tickerGroups - Active holdings passed down from the portfolio server component.
 * @param industryMap - Maps each ticker to its industry, fetched from the stocks table.
 */
export function PortfolioInsights({ portfolioId, tickerGroups, industryMap }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('performance')

  return (
    <div className={styles.container}>
      <div role="tablist" aria-label="Portfolio insights" className={styles.tabList}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {TABS.map(({ id, label }) => (
        <div
          key={id}
          role="tabpanel"
          id={`panel-${id}`}
          aria-labelledby={`tab-${id}`}
          hidden={activeTab !== id}
          className={styles.panel}
        >
          {id === 'performance' && (
            <PerformanceChart portfolioId={portfolioId} />
          )}
          {id === 'composition' && (
            <CompositionChart tickerGroups={tickerGroups} industryMap={industryMap} />
          )}
          {id === 'daily-summary' && (
            <p className={styles.placeholder}>{label} coming soon</p>
          )}
        </div>
      ))}
    </div>
  )
}
