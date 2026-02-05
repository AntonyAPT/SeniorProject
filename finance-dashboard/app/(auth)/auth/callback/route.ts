import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if profile exists, if not create one with Google metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        // Create profile with Google metadata
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: data.user.user_metadata.full_name || data.user.email?.split('@')[0],
          avatar_url: data.user.user_metadata.avatar_url,
        })
      }

      // Fetch user's default portfolio
      // If a new user signs up and the trigger hasn't run yet (race condition), 
      // the defaultPortfolio query might return null. 
      // The code above handles this with a fallback to /dashboard.
      const { data: defaultPortfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('is_default', true)
        .single()

      // Redirect to default portfolio, or dashboard as fallback
      const redirectPath = defaultPortfolio 
        ? `/portfolio/${defaultPortfolio.id}`
        : '/dashboard'

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Auth error - redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}