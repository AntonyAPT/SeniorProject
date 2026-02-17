'use client'

// (react) hooks can only be used in client components
import { useRouter } from 'next/navigation'

export type NavigationTarget =
  | 'dashboard'
  | 'portfolio'
  | 'watchlist'
  | 'stocks'
  | 'stock-search'
  | 'settings'
  | 'portfolios'
  | 'theme'

export function useNavigation() {
  const router = useRouter()

  const navigate = (target: NavigationTarget, params?: { id?: string }) => {
    // For now, just log - replace with actual routes later
    console.log(`Navigating to: ${target}`, params)

    // Future implementation:
    switch (target) {
      case 'stocks':
        console.log('Navigating to stocks page')
        router.push('/stocks')
        break
    //   case 'dashboard':
    //     router.push('/dashboard')
    //     break
    //   case 'stock-search':
    //     router.push('/stock-search')
    //     break
    //   case 'portfolio':
    //     router.push(`/portfolio/${params?.id}`)
    //     break
    //   case 'watchlist':
    //     router.push('/watchlist')
    //     break
    //   case 'settings':
    //     router.push('/settings')
    //     break
    //   case 'portfolios':
    //     router.push('/portfolios')
    //     break
    //   case 'theme':
    //     // Handle theme toggle separately
    //     break
    }
  }

  // acts like the hooks 'public API'
  return { navigate }
}