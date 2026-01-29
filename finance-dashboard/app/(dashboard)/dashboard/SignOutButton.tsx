'use client' // onClick handler (interactivity)

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
      className="mt-6 px-4 py-2 bg-surface hover:bg-card rounded-lg transition-colors"
    >
      Sign Out
    </button>
  )
}