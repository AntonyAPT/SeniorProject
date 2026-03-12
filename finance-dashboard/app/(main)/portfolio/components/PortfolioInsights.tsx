'use client'

import { useState } from 'react'
import styles from './portfolioInsights.module.css'

type TabId = 'performance' | 'composition' | 'daily-summary'

const TABS: { id: TabId; label: string }[] = [
  { id: 'performance',   label: 'Performance'   },
  { id: 'composition',   label: 'Composition'   },
  { id: 'daily-summary', label: 'Daily Summary' },
]

/**
 * Tabbed container for portfolio analytics panels.
 *
 * Each tab is a placeholder until the corresponding chart/data
 * component is built out. Tabs are centered and styled to match
 * the dark slate theme of the portfolio detail page.
 */
export function PortfolioInsights() {
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
          <p className={styles.placeholder}>{label} coming soon</p>
        </div>
      ))}
    </div>
  )
}
