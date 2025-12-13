import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionToken } from './lib/session/getSessionToken'

export async function proxy(request: NextRequest) {
  const session = await getSessionToken()

  if (session) {
    if (request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/vault', request.url))
    }

    if (request.nextUrl.pathname === '/signin') {
      return NextResponse.redirect(new URL('/vault', request.url))
    }

    if (request.nextUrl.pathname === '/signup') {
      return NextResponse.redirect(new URL('/vault', request.url))
    }
  } else {
    if (request.nextUrl.pathname === '/vault') {
      return NextResponse.redirect(new URL('/signin', request.url))
    } else if (request.nextUrl.pathname === '/shares') {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/vault',
    '/signin',
    '/signup',
    '/shares'
  ]
}
