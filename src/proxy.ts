import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routen die OHNE Login zugänglich sind
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/invite',
  '/scan',          // öffentlicher QR/NFC Scan
  '/auth/callback',
  '/api/scan',      // API für NFC-Scan ohne Login
  '/api/webhooks',  // Stripe Webhooks
]

// Routen die NUR für Platform Admins sind
const ADMIN_ROUTES = ['/admin']

export async function proxy(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Öffentliche Routen: immer erlaubt
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublic) return supabaseResponse

  // Nicht eingeloggt → Login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-Routen: nur für Platform Admins
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_platform_admin) {
      return NextResponse.redirect(new URL('/assets', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
