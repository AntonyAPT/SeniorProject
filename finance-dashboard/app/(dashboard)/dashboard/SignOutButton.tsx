'use client'

import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <button 
      onClick={handleSignOut}
      className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
    >
      Sign Out
    </button>
  )
}