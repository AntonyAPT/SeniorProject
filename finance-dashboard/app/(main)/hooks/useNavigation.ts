'use client'

// (react) hooks can only be used in client components
import { useRouter } from 'next/navigation'

export type NavigationTarget =
  | 'dashboard'
  | 'portfolio'
  | 'watchlist'
  | 'stock-search'
  | 'settings'
  | 'portfolios'
  | 'theme'

export function useNavigation() {
  const router = useRouter()

  const navigate = (target: NavigationTarget, params?: { id?: string }) => {
    switch (target) {
      case 'dashboard':
        router.push('/dashboard')
        break
      case 'stock-search':
        router.push('/stock-search')
        break
      case 'portfolio':
        if (params?.id) {
          router.push(`/portfolio/${params.id}`)
        }
        break
      case 'watchlist':
        router.push('/watchlist')
        break
      case 'settings':
        router.push('/settings')
        break
      case 'portfolios':
        router.push('/portfolios')
        break
      case 'theme':
        // Theme toggle is handled separately by the component
        break
    }
  }

  // acts like the hooks 'public API'
  return { navigate }
}