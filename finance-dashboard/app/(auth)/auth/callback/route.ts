import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET handler - Google redirects here with a code query parameter
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

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

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error - redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}