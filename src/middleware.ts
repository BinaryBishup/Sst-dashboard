import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Temporarily disable authentication to fix loading issue
  // Uncomment the code below after setting up Supabase environment variables
  return NextResponse.next()
  
  /* 
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and trying to access protected routes
  if (!session && req.nextUrl.pathname !== '/auth') {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // If user is signed in and trying to access auth page
  if (session && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
  */
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}