# SeniorProject: Stock Analysis (Phase 1)

Stonks is a minimalist finance dashboard designed to empower individual investors with the tools they need to track and analyze their stock investments in one streamlined interface. The platform enables users to build and monitor personalized stock portfolios, maintain watchlists of securities they're interested in, and access technical analysis through interactive price charts with candlestick and line graph options. Beyond portfolio tracking, users can look up individual stocks to view key statistics, recent news, earnings reports, and other relevant financial disclosures—all in a clean, distraction-free environment. Built with a focus on simplicity and usability, Stonks provides secure user authentication and persistent data storage, allowing investors to seamlessly manage their financial insights from any device.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your App                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Auth Pages  │    │  Dashboard   │    │ Stock Pages  │       │
│  │  (login,     │    │  Portfolio   │    │  (charts,    │       │
│  │   signup)    │    │  Watchlist   │    │   stats)     │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Server Actions                       │    │
│  │              (auth.ts, portfolio.ts, etc.)              │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌─────────────────┐                   ┌─────────────────┐
│    Supabase     │                   │  External APIs  │
│  (Auth + DB)    │                   │  (Stock data,   │
│                 │                   │   news, etc.)   │
│  - profiles     │                   │                 │
│  - holdings     │                   │  - Alpha Vantage│
│  - watchlist    │                   │  - Polygon.io   │
└─────────────────┘                   │  - Yahoo Finance│
                                      └─────────────────┘
```

## Project Structure

```

finance-dashboard/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── auth/callback/route.ts    # OAuth callback handler
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── watchlist/page.tsx
│   │   ├── stocks/[ticker]/page.tsx
│   │   ├── profile/page.tsx
│   │   └── layout.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client (for client components)
│   │   ├── server.ts          # Server client (for server components/actions)
│   │   ├── middleware.ts      # Auth middleware helper
│   │   └── types.ts           # Generated database types
│   │
│   ├── api/
│   │   ├── stocks.ts          # External stock API calls
│   │   └── news.ts            # News/reports API
│   │
│   └── utils.ts
│
├── actions/                   # Server Actions for mutations
│   ├── auth.ts                # Login, signup, logout actions
│   ├── portfolio.ts           # Add/remove holdings
│   ├── watchlist.ts           # Add/remove from watchlist
│   └── profile.ts             # Update user settings
│
├── middleware.ts              # Next.js middleware for auth protection
│
├── components/
│   └── ... (same as before)
│
├── types/
│   ├── database.ts            # Supabase generated types
│   └── ...
│
└── supabase/
    ├── migrations/            # Database migrations
    └── seed.sql               # Optional seed data 

```