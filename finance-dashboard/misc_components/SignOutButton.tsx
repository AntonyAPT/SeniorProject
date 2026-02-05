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
      className="px-4 py-2 text-muted hover:text-foreground border border-border hover:border-muted rounded-md transition-colors"
      //className="px-4 py-2 text-muted hover:text-error border border-border hover:border-error/50 rounded-md transition-colors"
    >
      Sign Out
    </button>
  )
}