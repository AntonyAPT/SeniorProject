import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Purpose: Route-level auth protection for all /dashboard/* routes (proxy backup)
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // can add shared dashboard UI here later (sidebar, navbar, etc.)
  return <>{children}</>
}