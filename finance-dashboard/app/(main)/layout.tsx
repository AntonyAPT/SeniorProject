import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from './components/navbar/Navbar'
import { SelectedPortfolioProvider } from './contexts/SelectedPortfolioContext'
import { Toaster } from 'sonner'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // (backup protection - proxy should catch this first)
  if (!user) {
    redirect('/sign-in')
  }

  return (
    // context provider wrapped around every authenticated page (dashboard, watchlist, etc.)
    <SelectedPortfolioProvider>
      <div className="min-h-screen bg-page flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-800/60">
          <div className="mx-auto max-w-[1600px] px-6 py-4">
            <p className="text-center text-xs text-slate-500">
              Market data and widgets by TradingView · Not financial advice
            </p>
          </div>
        </footer>
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </SelectedPortfolioProvider>
  )
}
