# SeniorProject: Stock Analysis (Phase 1)

[STONKS] is a minimalist finance dashboard designed to empower individual investors with the tools they need to track and analyze their stock investments in one streamlined interface. The platform enables users to build and monitor personalized stock portfolios, maintain watchlists of securities they're interested in, and access technical analysis through interactive price charts with candlestick and line graph options. Beyond portfolio tracking, users can look up individual stocks to view key statistics, recent news, earnings reports, and other relevant financial disclosures in a clean, distraction-free environment. Built with a focus on simplicity and usability, [STONKS] provides secure user authentication and persistent data storage, allowing investors to seamlessly manage their financial insights from any device.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App: [STONKS]                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Auth Page   │    │  Dashboard   │    │ Stock Pages  │       │
│  │   (OAuth     │    │  Portfolio   │    │  (charts,    │       │
│  │   Sign-in)   │    │  Watchlist   │    │   stats)     │       │
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
│  (OAuth + DB)   │                   │  (Stock data,   │
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
│   │   ├── auth/callback/route.ts      # OAuth callback handler
│   │   ├── components/
│   │   │   ├── auth.module.css         # Auth-specific styles (CSS Module)
│   │   │   ├── index.ts                # Barrel file
│   │   │   └── Logo.tsx                # Brand logo component
│   │   ├── sign-in/
│   │   │   ├── page.tsx                # OAuth sign-in page
│   │   │   └── SignInButton.tsx        # OAuth button component
│   │   └── layout.tsx
│   │
│   ├── (main)/ 
│   │   ├── components/
│   │   │   ├── AddStockButton.tsx     # CTA to open stock search
│   │   │   └── navbar/
│   │   │       ├── Navbar.tsx         # Top navigation bar (server)
│   │   │       ├── NavLinks.tsx       # Icon-based primary nav links
│   │   │       ├── UserMenu.tsx       # Avatar dropdown + sign out
│   │   │       └── navbar.module.css  # Navbar styles (CSS Module) 
│   │   ├── hooks/
│   │   │   ├── index.ts               # Barrel file for hooks
│   │   │   └── useNavigation.ts       # Centralized navigation helper                  
│   │   ├── dashboard/page.tsx
│   │   ├── portfolio/[id]/page.tsx
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
│   │   └── proxy.ts           # Middleware/Auth helper (Next.js 16+)
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
├── proxy.ts                   # Next.js 16+ proxy for auth protection  (no longer named middleware.ts)
├── next.config.ts                     # Next.js config (image domains, etc.)
│
├── components/
│   └── ... (same as before, more general directory for the entire project)
│
├── types/
│   ├── database.ts            # Supabase generated types
│   └── ...
│
└── supabase/
    ├── migrations/            # Database migrations
    └── seed.sql               # Optional seed data 
...

```