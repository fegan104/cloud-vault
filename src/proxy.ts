import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')

  if (session && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session && request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  if (!session && request.nextUrl.pathname === '/upload') {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}
