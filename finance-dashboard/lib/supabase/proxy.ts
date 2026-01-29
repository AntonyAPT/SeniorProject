import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication (might add "/" later for a landing page introducing the product)
const publicRoutes = ['/sign-in', '/auth/callback']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate and refresh the JWT token
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims ?? null

  const pathname = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(pathname)

  // If user is NOT logged in and trying to access a protected route
  if (!claims && !isPublicRoute) {
    const loginUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user IS logged in and on public route OR root, redirect to dashboard ('/' route treated specifically as landing page not set up yet)
  if (claims && (isPublicRoute || pathname === '/') && pathname !== '/auth/callback') {
    const homeUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}