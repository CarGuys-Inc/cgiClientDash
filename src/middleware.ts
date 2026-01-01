import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This refreshes the session if it exists and checks auth status
  const { data: { user } } = await supabase.auth.getUser()

  // Protect the dashboard: If no user, redirect to login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/webhooks (Stripe background events)
     * - api/save-signup-data (The route your StripeForm calls)
     * - login (The instruction page)
     * - auth (Supabase auth processing)
     * - signup (The page containing the StripeForm)
     * - static assets (_next/static, etc.)
     */
    '/((?!api/webhooks|api/save-signup-data|login|auth|signup|_next/static|_next/image|favicon.ico).*)',
  ],
}