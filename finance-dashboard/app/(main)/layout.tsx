import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from './components/navbar/Navbar'
import { SelectedPortfolioProvider } from './contexts/SelectedPortfolioContext'

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
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>{children}</main>
      </div>
    </SelectedPortfolioProvider>
  )
}
