import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from './SignOutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  const displayName = profile?.username || user.user_metadata.full_name || user.email

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          Welcome, {displayName}!
        </h1>
        <p className="text-zinc-400">
          Your Stonks dashboard is ready. Start tracking your investments.
        </p>
        <SignOutButton />
      </div>
    </div>
  )
}