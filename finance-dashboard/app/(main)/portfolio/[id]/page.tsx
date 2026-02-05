import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AddStockButton } from '../../components/AddStockButton'

type Props = {
  params: Promise<{ id: string }>
}

export default async function PortfolioPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Fetch the specific portfolio
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select('id, name, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !portfolio) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          Portfolio {portfolio.name} Summary
        </h1>
        <p className="text-muted">
          Viewing portfolio details.
        </p>
        
        {/* Placeholder sections */}
        <div className="mt-8 grid gap-6">
          <section className="p-6 bg-surface rounded-lg border border-border-muted">
            <p className="text-muted-foreground">Chart component placeholder</p>
          </section>
          
          <section className="p-6 bg-surface rounded-lg border border-border-muted">
            <p className="text-muted-foreground">Holdings list placeholder</p>
          </section>
          
          <AddStockButton />
        </div>
      </div>
    </div>
  )
}